import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Use process.env for configuration
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- MONGODB CONNECTION (Serverless Optimization) ---
let isConnected = false;

const connectToDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
  }
};

// Ensure DB connection for every request (Serverless pattern)
app.use(async (req, res, next) => {
    await connectToDB();
    next();
});

// --- DATA MODELS (Same as server.js) ---
// (Copy pasting the Schema definitions here to be self-contained)

const PatientSchema = new mongoose.Schema({
  name: String, age: String, gender: String, phone: String, prakriti: String, createdAt: { type: Date, default: Date.now }
});
const Patient = mongoose.model('Patient', mongoose.models.Patient || PatientSchema);

const PrescriptionSchema = new mongoose.Schema({
  patientId: String, patientName: String, patientAge: String, patientGender: String, patientPhone: String, doctorName: String, date: { type: Date, default: Date.now },
  symptoms: Array, nadi: String, agni: String, koshta: String, diagnosis: String, nidan: String, medicines: Array, pathya: String, internalCharges: String, followUp: String, notes: String
});
const Prescription = mongoose.model('Prescription', mongoose.models.Prescription || PrescriptionSchema);

const MedicineSchema = new mongoose.Schema({ name: String, type: String, stock: { type: Number, default: 0 } });
const Medicine = mongoose.model('Medicine', mongoose.models.Medicine || MedicineSchema);

const DiagnosisSchema = new mongoose.Schema({ name: String, english: String });
const Diagnosis = mongoose.model('Diagnosis', mongoose.models.Diagnosis || DiagnosisSchema);

const NidanSchema = new mongoose.Schema({ name: String });
const Nidan = mongoose.model('Nidan', mongoose.models.Nidan || NidanSchema);

const SymptomSchema = new mongoose.Schema({ name: String });
const Symptom = mongoose.model('Symptom', mongoose.models.Symptom || SymptomSchema);

const AnupanSchema = new mongoose.Schema({ name: String });
const Anupan = mongoose.model('Anupan', mongoose.models.Anupan || AnupanSchema);

const PathyaSchema = new mongoose.Schema({ name: String, category: String }); 
const Pathya = mongoose.model('Pathya', mongoose.models.Pathya || PathyaSchema);

const SettingsSchema = new mongoose.Schema({
  clinicName: { type: String, default: 'Ayurvedshala' },
  doctorName: { type: String, default: 'Dr. Dimple' },
  logoUrl: String,
  doctorPwd: { type: String, default: 'admin' },
  staffPwd: { type: String, default: 'staff' }
});
const Settings = mongoose.model('Settings', mongoose.models.Settings || SettingsSchema);

// --- API ROUTES ---

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

app.get('/api/patients', async (req, res) => {
  const patients = await Patient.find().sort({ createdAt: -1 });
  res.json(patients);
});

app.post('/api/patients', async (req, res) => {
  try {
    const newPatient = await Patient.create(req.body);
    res.json(newPatient);
  } catch(e) { res.status(500).json(e); }
});

app.get('/api/prescriptions', async (req, res) => {
  const rx = await Prescription.find().sort({ date: -1 });
  res.json(rx);
});

app.post('/api/prescriptions', async (req, res) => {
  try {
    const rxData = req.body;
    const newRx = await Prescription.create(rxData);
    // Stock logic
    if (rxData.medicines && rxData.medicines.length > 0) {
      const operations = [];
      rxData.medicines.forEach(med => {
        if (med.type === 'combination' && med.ingredients) {
            med.ingredients.forEach(ing => operations.push({ updateOne: { filter: { name: ing.name }, update: { $inc: { stock: -1 } } } }));
        } else {
            operations.push({ updateOne: { filter: { name: med.name }, update: { $inc: { stock: -1 } } } });
        }
      });
      if(operations.length > 0) await Medicine.bulkWrite(operations);
    }
    res.json(newRx);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/prescriptions/patient/:id', async (req, res) => {
  const rx = await Prescription.find({ patientId: req.params.id }).sort({ date: -1 });
  res.json(rx);
});

// Master Routes Helper
const createMasterRoutes = (route, Model) => {
  app.get(`/api/${route}`, async (req, res) => res.json(await Model.find().sort({ name: 1 })));
  app.post(`/api/${route}`, async (req, res) => res.json(await Model.create(req.body)));
  app.delete(`/api/${route}/:id`, async (req, res) => { await Model.findByIdAndDelete(req.params.id); res.json({success:true}); });
  app.post(`/api/${route}/bulk`, async (req, res) => {
      try {
        const operations = req.body.map(item => ({ updateOne: { filter: { name: item.name }, update: { $set: item }, upsert: true } }));
        await Model.bulkWrite(operations);
        res.json({ success: true });
      } catch(e) { res.status(500).json(e); }
  });
};

createMasterRoutes('medicines', Medicine);
createMasterRoutes('diagnoses', Diagnosis);
createMasterRoutes('nidans', Nidan);
createMasterRoutes('symptoms', Symptom);
createMasterRoutes('anupans', Anupan);
createMasterRoutes('pathyas', Pathya);

app.put('/api/medicines/:id', async (req, res) => {
  const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

export default app;