import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ayurclinic';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- DATA MODELS ---

const PatientSchema = new mongoose.Schema({
  name: String,
  age: String,
  gender: String,
  phone: String,
  prakriti: String,
  createdAt: { type: Date, default: Date.now }
});
const Patient = mongoose.model('Patient', PatientSchema);

// Updated Prescription to include Ayurvedic specifics
const PrescriptionSchema = new mongoose.Schema({
  patientId: String,
  patientName: String,
  patientAge: String,
  patientGender: String,
  patientPhone: String,
  doctorName: String,
  date: { type: Date, default: Date.now },
  
  // Clinical Observations
  symptoms: Array, // Chief Complaints
  nadi: String,    // Pulse
  agni: String,    // Digestive Fire
  koshta: String,  // Bowel
  
  diagnosis: String,
  nidan: String,
  
  // Medicines can now store complex objects (Packed or Combination)
  medicines: Array, 
  
  // Advice
  pathya: String,   // Diet/Lifestyle
  internalCharges: String,
  followUp: String,
  notes: String
});
const Prescription = mongoose.model('Prescription', PrescriptionSchema);

const MedicineSchema = new mongoose.Schema({
  name: String,
  type: String,
  stock: { type: Number, default: 0 }
});
const Medicine = mongoose.model('Medicine', MedicineSchema);

const DiagnosisSchema = new mongoose.Schema({ name: String, english: String });
const Diagnosis = mongoose.model('Diagnosis', DiagnosisSchema);

// NEW MASTERS
const NidanSchema = new mongoose.Schema({ name: String });
const Nidan = mongoose.model('Nidan', NidanSchema);

const SymptomSchema = new mongoose.Schema({ name: String });
const Symptom = mongoose.model('Symptom', SymptomSchema);

const AnupanSchema = new mongoose.Schema({ name: String });
const Anupan = mongoose.model('Anupan', AnupanSchema);

const PathyaSchema = new mongoose.Schema({ name: String, category: String }); 
const Pathya = mongoose.model('Pathya', PathyaSchema);

const SettingsSchema = new mongoose.Schema({
  clinicName: { type: String, default: 'Ayurvedshala' },
  doctorName: { type: String, default: 'Dr. Dimple' },
  logoUrl: String,
  doctorPwd: { type: String, default: 'admin' },
  staffPwd: { type: String, default: 'staff' }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// --- HELPER FOR BULK UPLOAD ---
const handleBulkUpload = async (Model, data, res) => {
  try {
    const operations = data.map(item => ({
      updateOne: {
        filter: { name: item.name },
        update: { $set: item },
        upsert: true
      }
    }));
    await Model.bulkWrite(operations);
    res.json({ success: true, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- API ROUTES ---

// Settings
app.get('/api/settings', async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});
app.put('/api/settings', async (req, res) => {
  const { _id, ...updateData } = req.body;
  const settings = await Settings.findOneAndUpdate({}, updateData, { new: true, upsert: true });
  res.json(settings);
});

// Patients
app.get('/api/patients', async (req, res) => {
  const patients = await Patient.find().sort({ createdAt: -1 });
  res.json(patients);
});
app.post('/api/patients', async (req, res) => {
  const newPatient = await Patient.create(req.body);
  res.json(newPatient);
});

// Prescriptions
app.get('/api/prescriptions', async (req, res) => {
  const rx = await Prescription.find().sort({ date: -1 });
  res.json(rx);
});
app.get('/api/prescriptions/patient/:id', async (req, res) => {
  const rx = await Prescription.find({ patientId: req.params.id }).sort({ date: -1 });
  res.json(rx);
});

// UPDATED PRESCRIPTION POST: Handles Stock Deduction for Combinations
app.post('/api/prescriptions', async (req, res) => {
  try {
    const rxData = req.body;
    const newRx = await Prescription.create(rxData);

    // Stock Deduction Logic
    if (rxData.medicines && rxData.medicines.length > 0) {
      const operations = [];

      rxData.medicines.forEach(med => {
        if (med.type === 'combination' && med.ingredients && Array.isArray(med.ingredients)) {
            // If it's a combination, deduct stock for EACH ingredient
            med.ingredients.forEach(ing => {
                operations.push({
                    updateOne: {
                        filter: { name: ing.name },
                        update: { $inc: { stock: -1 } } // Decrement 1 unit per use (simplification)
                    }
                });
            });
        } else {
            // If it's a packed/standard medicine, deduct the medicine itself
            operations.push({
                updateOne: {
                    filter: { name: med.name },
                    update: { $inc: { stock: -1 } }
                }
            });
        }
      });

      if (operations.length > 0) {
        await Medicine.bulkWrite(operations);
      }
    }
    res.json(newRx);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MASTERS (Generic Handlers for simple lists)
const createMasterRoutes = (route, Model) => {
  app.get(`/api/${route}`, async (req, res) => res.json(await Model.find().sort({ name: 1 })));
  app.post(`/api/${route}`, async (req, res) => res.json(await Model.create(req.body)));
  app.delete(`/api/${route}/:id`, async (req, res) => { await Model.findByIdAndDelete(req.params.id); res.json({success:true}); });
  app.post(`/api/${route}/bulk`, async (req, res) => handleBulkUpload(Model, req.body, res));
};

createMasterRoutes('medicines', Medicine);
createMasterRoutes('diagnoses', Diagnosis);
createMasterRoutes('nidans', Nidan);
createMasterRoutes('symptoms', Symptom);
createMasterRoutes('anupans', Anupan);
createMasterRoutes('pathyas', Pathya);

// Medicine Stock Update (Specific)
app.put('/api/medicines/:id', async (req, res) => {
  const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ayurvedic Server running on http://0.0.0.0:${PORT}`);
});