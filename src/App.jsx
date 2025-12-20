import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Users, FileText, LogOut, Plus, Search, 
  Printer, Activity, Pill, DollarSign, Calendar, 
  Settings, Leaf, Trash2, Database, UserPlus, AlertCircle, ChevronRight, Wifi, Clock, Eye, X, Upload, Package, History, HeartPulse, ScrollText, CheckSquare, Target, Layers, Box
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// ==========================================
// CONSTANTS & UTILS
// ==========================================
const PRESET_DOSAGES = ["1 Tab", "2 Tabs", "1/2 Tab", "1 Tsp (3g)", "2 Tsp (6g)", "1/2 Tsp", "10 ml", "15 ml", "20 ml", "30 ml", "1 Sachet (Pudia)", "1 Pinch", "1 Ratti (125mg)", "3-6 Grams"];
const PRESET_FREQUENCIES = ["1 Time/Day", "2 Times/Day (BD)", "3 Times/Day (TDS)", "Empty Stomach", "Before Food", "After Food", "With Food", "Bedtime", "As needed (SOS)"];
const PRESET_DURATIONS = ["3 Days", "5 Days", "7 Days", "10 Days", "15 Days", "21 Days", "1 Month", "2 Months", "3 Months", "1 Mandala (48 Days)"];
const PRESET_UNITS = ["g", "mg", "ml", "part"];

const generatePDF = (rx, settings) => {
    if (!window.jspdf || !window.jspdf.jsPDF) return alert("PDF lib loading...");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const themeColor = [16, 185, 129]; 

    if(settings.logoUrl) { try { doc.addImage(settings.logoUrl, 'JPEG', 15, 10, 25, 25); } catch(e){ console.error(e); } }
    
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(...themeColor);
    doc.text((settings.clinicName || 'Ayurvedshala').toUpperCase(), pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12); doc.setTextColor(50, 50, 50);
    doc.text(rx.doctorName || "Ayurvedic Physician", pageWidth / 2, 28, { align: "center" });
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("Consultant Ayurveda", pageWidth / 2, 33, { align: "center" });
    doc.setDrawColor(...themeColor); doc.setLineWidth(0.5); doc.line(15, 40, pageWidth - 15, 40);

    doc.setFillColor(248, 250, 252); doc.rect(15, 45, pageWidth - 30, 25, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0);
    doc.text("Patient Name:", 20, 53); doc.setFont("helvetica", "normal"); doc.text(rx.patientName, 50, 53);
    doc.setFont("helvetica", "bold"); doc.text("Age / Gender:", 20, 60); doc.setFont("helvetica", "normal"); doc.text(`${rx.patientAge} Yrs / ${rx.patientGender}`, 50, 60);
    doc.setFont("helvetica", "bold"); doc.text("Date:", 120, 53); doc.setFont("helvetica", "normal"); doc.text(new Date(rx.date).toLocaleDateString(), 150, 53);
    doc.setFont("helvetica", "bold"); doc.text("Contact:", 120, 60); doc.setFont("helvetica", "normal"); doc.text(rx.patientPhone || 'N/A', 150, 60);

    let yPos = 80;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...themeColor); doc.text("Clinical Observations", 15, yPos); yPos += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0);
    let diagnosisText = `Diagnosis: ${rx.diagnosis || '-'}`;
    if(rx.nidan) diagnosisText += `  |  Nidan: ${rx.nidan}`;
    doc.text(diagnosisText, 15, yPos); yPos += 6;
    let params = [];
    if(rx.nadi) params.push(`Nadi: ${rx.nadi}`);
    if(rx.agni) params.push(`Agni: ${rx.agni}`);
    if(rx.koshta) params.push(`Koshta: ${rx.koshta}`);
    if(params.length > 0) { doc.text(params.join("  •  "), 15, yPos); yPos += 10; } else { yPos += 4; }
    doc.setDrawColor(200); doc.line(15, yPos, pageWidth - 15, yPos); yPos += 10;

    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(0); doc.text("Rx", 15, yPos); yPos += 10;
    doc.setFillColor(...themeColor); doc.rect(15, yPos, pageWidth - 30, 8, "F");
    doc.setTextColor(255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Medicine Name", 20, yPos + 5.5); doc.text("Dosage", 90, yPos + 5.5); doc.text("Duration", 130, yPos + 5.5); doc.text("Anupan", 160, yPos + 5.5);
    yPos += 12; doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setFontSize(10);

    rx.medicines.forEach((m, i) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "bold"); doc.text(`${i+1}. ${m.name}`, 20, yPos);
        doc.setFont("helvetica", "normal"); doc.text(`${m.dose} • ${m.freq}`, 90, yPos); doc.text(m.duration, 130, yPos); doc.text(m.anupan || '-', 160, yPos);
        yPos += 8; doc.setDrawColor(240); doc.line(15, yPos - 4, pageWidth - 15, yPos - 4); yPos += 4;
    });
    yPos += 5;

    if(rx.pathya) {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "bold"); doc.setTextColor(...themeColor); doc.text("Pathya / Diet Instructions:", 15, yPos); yPos += 6;
        doc.setFont("helvetica", "normal"); doc.setTextColor(0);
        doc.text(doc.splitTextToSize(rx.pathya, pageWidth - 30), 15, yPos); yPos += 15;
    }
    if(rx.notes) {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "bold"); doc.setTextColor(...themeColor); doc.text("Special Notes:", 15, yPos); yPos += 6;
        doc.setFont("helvetica", "normal"); doc.setTextColor(0);
        doc.text(doc.splitTextToSize(rx.notes, pageWidth - 30), 15, yPos); yPos += 15;
    }
    if(rx.followUp) { doc.setFont("helvetica", "bold"); doc.text(`Next Visit: ${rx.followUp}`, 15, yPos); }
    const footerY = 280;
    doc.setDrawColor(...themeColor); doc.line(15, footerY, pageWidth - 15, footerY);
    doc.setFontSize(8); doc.setTextColor(100); doc.text("Generated by Ayurvedshala Management System", 15, footerY + 8);
    doc.setFontSize(10); doc.setTextColor(0); doc.text("Doctor's Signature", pageWidth - 15, footerY + 20, { align: "right" });
    doc.save(`Rx_${rx.patientName}.pdf`);
};

// ==========================================
// SUB-COMPONENTS (MODULES)
// ==========================================

const Sidebar = ({ user, view, setView, onLogout, settings }) => (
  <div className="w-64 bg-emerald-900 text-white flex flex-col p-4 shadow-xl shrink-0">
    <div className="mb-8 flex items-center gap-3">
        {settings.logoUrl ? <img src={settings.logoUrl} className="w-10 h-10 rounded-full bg-white p-1 object-contain"/> : <Leaf/>}
        <div className="overflow-hidden"><h1 className="font-bold truncate font-serif">{settings.clinicName}</h1><p className="text-[10px] text-emerald-200">Ayurvedic Mgmt</p></div>
    </div>
    <nav className="space-y-2 flex-1">
        {user.role === 'doctor' ? (
            <>
                {['dashboard', 'new-rx', 'masters', 'settings'].map(v => (
                    <button key={v} onClick={()=>setView(v)} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${view===v?'bg-emerald-700 shadow-inner':'hover:bg-emerald-800'}`}>
                        {v==='dashboard' && <Users size={18}/>} {v==='new-rx' && <ScrollText size={18}/>} {v==='masters' && <Database size={18}/>} {v==='settings' && <Settings size={18}/>}
                        <span className="capitalize">{v.replace('-',' ')}</span>
                    </button>
                ))}
            </>
        ) : ( <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-emerald-700"><FileText size={18}/> Rx Queue</button> )}
    </nav>
    <button onClick={onLogout} className="flex items-center gap-2 text-emerald-200 mt-auto hover:text-white"><LogOut size={16}/> Logout</button>
  </div>
);

const DoctorDashboard = ({ patients, onAddPatient, onSelectPatient, prescriptions, onViewRx, onPrintRx }) => {
    const [tab, setTab] = useState('patients');
    const [search, setSearch] = useState('');
    const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: 'Male', phone: '', prakriti: 'Vata' });

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));
    const filteredRx = prescriptions.filter(rx => rx.patientName.toLowerCase().includes(search.toLowerCase()) || rx.diagnosis?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-emerald-100 h-full flex flex-col">
                <h3 className="font-bold mb-4 text-emerald-900 flex items-center gap-2"><UserPlus size={18}/> New Patient</h3>
                <form onSubmit={(e) => { e.preventDefault(); onAddPatient(newPatient); setNewPatient({ name: '', age: '', gender: 'Male', phone: '', prakriti: 'Vata' }); }} className="space-y-3 flex-1 flex flex-col">
                    <input placeholder="Name" className="w-full p-3 border rounded-lg bg-white" value={newPatient.name} onChange={e=>setNewPatient({...newPatient, name:e.target.value})} required/>
                    <div className="flex gap-2"><input placeholder="Age" className="w-full p-3 border rounded-lg bg-white" value={newPatient.age} onChange={e=>setNewPatient({...newPatient, age:e.target.value})}/><select className="p-3 border rounded-lg bg-white" value={newPatient.gender} onChange={e=>setNewPatient({...newPatient, gender:e.target.value})}><option>Male</option><option>Female</option></select></div>
                    <input placeholder="Phone" className="w-full p-3 border rounded-lg bg-white" value={newPatient.phone} onChange={e=>setNewPatient({...newPatient, phone:e.target.value})}/>
                    <div className="pt-2"><div className="flex gap-2 mt-1">{['Vata', 'Pitta', 'Kapha'].map(p=>(<button type="button" key={p} onClick={()=>setNewPatient({...newPatient, prakriti:p})} className={`flex-1 py-2 text-xs border rounded-lg ${newPatient.prakriti===p?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-600'}`}>{p}</button>))}</div></div>
                    <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 mt-auto">Add Patient</button>
                </form>
            </div>
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-emerald-100 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-3 text-sm font-bold">
                        <button onClick={()=>setTab('patients')} className={`flex items-center gap-2 px-3 py-1 rounded ${tab==='patients'?'bg-emerald-100 text-emerald-900':'text-slate-400 hover:text-slate-600'}`}><Users size={16}/> Recent Patients</button>
                        <button onClick={()=>setTab('rx')} className={`flex items-center gap-2 px-3 py-1 rounded ${tab==='rx'?'bg-emerald-100 text-emerald-900':'text-slate-400 hover:text-slate-600'}`}><FileText size={16}/> Recent Rx</button>
                    </div>
                    <div className="relative"><Search className="absolute left-2 top-2.5 text-slate-400" size={16}/><input className="pl-9 p-2 border rounded-lg text-sm w-64 focus:ring-1 focus:ring-emerald-500 outline-none bg-white text-black" placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)}/></div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left"><thead className="bg-emerald-50 sticky top-0 z-10"><tr><th className="p-3">{tab==='patients'?'Name':'Date'}</th><th className="p-3">{tab==='patients'?'Details':'Patient / Diagnosis'}</th><th className="p-3 text-right">Action</th></tr></thead>
                    <tbody className="divide-y divide-emerald-100">
                        {tab === 'patients' ? filteredPatients.map(p => (
                            <tr key={p._id} className="hover:bg-emerald-50/50">
                                <td className="p-3 font-medium text-slate-800">{p.name}</td>
                                <td className="p-3 text-slate-500">{p.age} Y • {p.gender} • <span className="text-emerald-700 font-bold">{p.prakriti}</span><div className="text-xs">{p.phone}</div></td>
                                <td className="p-3 text-right"><button onClick={()=>onSelectPatient(p)} className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded hover:bg-emerald-50 font-bold text-xs flex items-center gap-1 ml-auto">Prescribe <ChevronRight size={14}/></button></td>
                            </tr>
                        )) : filteredRx.map(rx => (
                            <tr key={rx._id} className="hover:bg-emerald-50/50">
                                <td className="p-3 text-slate-500">{new Date(rx.date).toLocaleDateString()}</td>
                                <td className="p-3 font-medium text-slate-800">{rx.patientName}<div className="text-xs text-slate-400">{rx.diagnosis}</div></td>
                                <td className="p-3 text-right flex justify-end gap-2"><button onClick={()=>onViewRx(rx)} className="p-1.5 bg-slate-100 rounded hover:bg-slate-200"><Eye size={16}/></button><button onClick={()=>onPrintRx(rx)} className="p-1.5 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200"><Printer size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody></table>
                </div>
            </div>
        </div>
    );
};

const PrescriptionModule = ({ patient, onClose, onSave, masters, onViewHistory }) => {
    const [rxForm, setRxForm] = useState({ symptoms: [], nadi: '', agni: '', koshta: '', diagnosis: '', nidan: '', medicines: [], pathya: '', internalCharges: '', followUp: '', notes: '' });
    const [medEntryMode, setMedEntryMode] = useState('packed'); 
    const [currentSymptom, setCurrentSymptom] = useState('');
    const [currentMed, setCurrentMed] = useState({ name: '', dose: '1 tsp', freq: '2x/day', duration: '7 days', anupan: 'Warm Water' });
    const [currentComb, setCurrentComb] = useState({ name: '', ingredients: [], dose: '1 Pudia', freq: '2x/day', duration: '7 days', anupan: 'Honey' });
    const [currentIngredient, setCurrentIngredient] = useState({ name: '', amount: '', unit: 'g' });

    const handleSave = () => {
        let finalMedicines = [...rxForm.medicines];
        if (medEntryMode === 'packed' && currentMed.name) finalMedicines.push({ ...currentMed, type: 'packed' });
        onSave({ ...rxForm, medicines: finalMedicines });
    };

    const addIngredientToComb = () => {
        if(currentIngredient.name && currentIngredient.amount) {
          setCurrentComb({
            ...currentComb,
            ingredients: [...currentComb.ingredients, currentIngredient]
          });
          setCurrentIngredient({ name: '', amount: '', unit: 'g' });
        }
    };
    
    const addCombinationToRx = () => {
        if(currentComb.name && currentComb.ingredients.length > 0) {
          setRxForm({
            ...rxForm,
            medicines: [...rxForm.medicines, { ...currentComb, type: 'combination' }]
          });
          setCurrentComb({ name: '', ingredients: [], dose: '1 Pudia', freq: '2x/day', duration: '7 days', anupan: 'Honey' });
        } else {
          alert("Please provide a combination name and at least one ingredient.");
        }
    };

    const addPackedToRx = () => {
        if(currentMed.name) {
          setRxForm({
            ...rxForm,
            medicines: [...rxForm.medicines, { ...currentMed, type: 'packed' }]
          });
          setCurrentMed({ name: '', dose: '1 tsp', freq: '2x/day', duration: '7 days', anupan: 'Warm Water' });
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="bg-emerald-900 text-white p-4 rounded-xl shadow flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-2xl">{patient.name.charAt(0)}</div><div><h2 className="text-2xl font-bold font-serif">{patient.name}</h2><p className="text-emerald-200 text-sm">{patient.age} Yrs / {patient.gender} • {patient.prakriti}</p></div></div>
                <div className="flex gap-3"><button onClick={onViewHistory} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded flex items-center gap-2"><History size={18}/> View History</button><button onClick={onClose} className="text-emerald-200 hover:text-white text-sm underline">Close</button></div>
            </div>
            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
                <div className="col-span-4 flex flex-col space-y-6 overflow-y-auto pr-2">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 border-b pb-2 mb-3 flex items-center gap-2"><HeartPulse size={16}/> Clinical Observations</h4>
                        <div className="mb-4"><label className="text-xs font-bold text-slate-500 uppercase">Chief Complaints</label><div className="flex gap-2 mb-2"><AutoSuggest items={masters.symptoms} value={currentSymptom} onChange={setCurrentSymptom} placeholder="Add symptom..."/><button onClick={()=>{if(currentSymptom){setRxForm({...rxForm, symptoms:[...rxForm.symptoms, currentSymptom]});setCurrentSymptom('')}}} className="bg-emerald-100 text-emerald-800 p-2 rounded"><Plus size={18}/></button></div><div className="flex flex-wrap gap-2">{rxForm.symptoms.map((s,i)=>(<span key={i} className="w-full p-2 border border-slate-200 rounded bg-white text-black focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-black">{s} <button onClick={()=>setRxForm({...rxForm, symptoms: rxForm.symptoms.filter((_,idx)=>idx!==i)})}><X size={12}/></button></span>))}</div></div>
                        <div className="grid grid-cols-3 gap-2 mb-4"><div><label className="text-[10px] font-bold uppercase">Nadi</label><input className="w-full p-1 border rounded text-sm bg-white" value={rxForm.nadi} onChange={e=>setRxForm({...rxForm, nadi:e.target.value})}/></div><div><label className="text-[10px] font-bold uppercase">Agni</label><input className="w-full p-1 border rounded text-sm bg-white" value={rxForm.agni} onChange={e=>setRxForm({...rxForm, agni:e.target.value})}/></div><div><label className="text-[10px] font-bold uppercase">Koshta</label><input className="w-full p-1 border rounded text-sm bg-white" value={rxForm.koshta} onChange={e=>setRxForm({...rxForm, koshta:e.target.value})}/></div></div>
                        <div className="space-y-2"><AutoSuggest label="Diagnosis" items={masters.diagnoses} value={rxForm.diagnosis} onChange={v=>setRxForm({...rxForm, diagnosis:v})} placeholder="Search..."/><AutoSuggest label="Nidan (Cause)" items={masters.nidans} value={rxForm.nidan} onChange={v=>setRxForm({...rxForm, nidan:v})} placeholder="Select..."/></div>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100"><label className="text-xs font-bold text-emerald-800 flex items-center gap-2"><DollarSign size={14}/> Internal Charges</label><input type="number" className="w-full p-2 mt-2 border border-emerald-300 rounded font-mono text-lg bg-white" value={rxForm.internalCharges} onChange={e=>setRxForm({...rxForm, internalCharges:e.target.value})} placeholder="₹ 0.00"/></div>
                </div>
                <div className="col-span-8 flex flex-col space-y-6 overflow-y-auto pr-2">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2"><Pill size={16}/> Prescription</h4>
                            <div className="flex gap-2"><button onClick={()=>setMedEntryMode('packed')} className={`px-3 py-1 text-xs font-bold rounded ${medEntryMode==='packed'?'bg-emerald-600 text-white':'bg-slate-100 text-slate-600'}`}>Packed</button><button onClick={()=>setMedEntryMode('combination')} className={`px-3 py-1 text-xs font-bold rounded ${medEntryMode==='combination'?'bg-emerald-600 text-white':'bg-slate-100 text-slate-600'}`}>Mix/Comb</button></div>
                        </div>
                        {medEntryMode === 'packed' && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 space-y-3 bg-white text-black ">
                                <div className="flex gap-2"><div className="flex-1"><AutoSuggest label="Medicine" items={masters.medicines} value={currentMed.name} onChange={v=>setCurrentMed({...currentMed, name:v})} placeholder="Search..."/></div><div className="w-1/3"><AutoSuggest label="Anupan" items={masters.anupans} value={currentMed.anupan} onChange={v=>setCurrentMed({...currentMed, anupan:v})} placeholder="Honey..."/></div></div>
                                <div className="grid grid-cols-4 gap-2"><div><input list="doseOptions" placeholder="Dose" className="p-2 border rounded w-full bg-white" value={currentMed.dose} onChange={e=>setCurrentMed({...currentMed, dose:e.target.value})}/></div><div><input list="freqOptions" placeholder="Freq" className="p-2 border rounded w-full bg-white" value={currentMed.freq} onChange={e=>setCurrentMed({...currentMed, freq:e.target.value})}/></div><div><input list="durOptions" placeholder="Duration" className="p-2 border rounded w-full bg-white" value={currentMed.duration} onChange={e=>setCurrentMed({...currentMed, duration:e.target.value})}/></div><button onClick={addPackedToRx} className="bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">Add</button></div>
                            </div>
                        )}
                        {medEntryMode === 'combination' && (
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 mb-4 space-y-3">
                                <div className="flex gap-2 items-center"><Layers size={16} className="text-emerald-700"/><input className="font-bold p-2 bg-white border border-emerald-300 rounded flex-1" placeholder="Combination Name (e.g. Vata Shamak Yoga)" value={currentComb.name} onChange={e=>setCurrentComb({...currentComb, name:e.target.value})}/></div>
                                <div className="flex gap-2 bg-white p-2 rounded border border-emerald-100"><div className="flex-1"><AutoSuggest label="" items={masters.medicines} value={currentIngredient.name} onChange={v=>setCurrentIngredient({...currentIngredient, name:v})} placeholder="Ingredient..."/></div><input className="w-20 p-2 border rounded bg-white" placeholder="Qty" value={currentIngredient.amount} onChange={e=>setCurrentIngredient({...currentIngredient, amount:e.target.value})}/><select className="p-2 border rounded bg-white" value={currentIngredient.unit} onChange={e=>setCurrentIngredient({...currentIngredient, unit:e.target.value})}>{PRESET_UNITS.map(u=><option key={u}>{u}</option>)}</select><button onClick={addIngredientToComb} className="bg-emerald-600 text-white px-3 rounded"><Plus size={16}/></button></div>
                                {currentComb.ingredients.length > 0 && (<div className="flex flex-wrap gap-2">{currentComb.ingredients.map((ing, i) => (<span key={i} className="text-xs bg-white border border-emerald-200 text-emerald-900 px-2 py-1 rounded flex items-center gap-1">{ing.name} ({ing.amount}{ing.unit}) <button onClick={()=>setCurrentComb({...currentComb, ingredients:currentComb.ingredients.filter((_,idx)=>idx!==i)})}>&times;</button></span>))}</div>)}
                                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-200"><div><input list="doseOptions" placeholder="Total Dose" className="p-2 border rounded w-full bg-white text-black" value={currentComb.dose} onChange={e=>setCurrentComb({...currentComb, dose:e.target.value})}/></div><div><input list="freqOptions" placeholder="Freq" className="p-2 border rounded w-full bg-white text-black" value={currentComb.freq} onChange={e=>setCurrentComb({...currentComb, freq:e.target.value})}/></div><div><input list="durOptions" placeholder="Dur" className="p-2 border rounded w-full bg-white text-black" value={currentComb.duration} onChange={e=>setCurrentComb({...currentComb, duration:e.target.value})}/></div><div><input placeholder="Anupan" className="p-2 border rounded w-full bg-white text-black" value={currentComb.anupan} onChange={e=>setCurrentComb({...currentComb, anupan:e.target.value})}/></div></div>
                                <button onClick={addCombinationToRx} className="w-full bg-emerald-700 text-white py-2 rounded font-bold hover:bg-emerald-800">Add Combination</button>
                            </div>
                        )}
                        <datalist id="doseOptions">{PRESET_DOSAGES.map(o=><option key={o} value={o}/>)}</datalist><datalist id="freqOptions">{PRESET_FREQUENCIES.map(o=><option key={o} value={o}/>)}</datalist><datalist id="durOptions">{PRESET_DURATIONS.map(o=><option key={o} value={o}/>)}</datalist>
                        <div className="space-y-2">
                            {rxForm.medicines.map((m,i)=>(
                                <div key={i} className={`flex justify-between items-center p-3 border rounded hover:bg-slate-50 ${m.type==='combination'?'bg-emerald-50 border-emerald-200':'bg-white'}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {m.type==='combination' ? <Layers size={14} className="text-emerald-700"/> : <Box size={14} className="text-slate-500"/>}
                                            <span className={`font-bold ${m.type==='combination'?'text-emerald-900':'text-teal-800'}`}>{m.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{m.dose} • {m.freq} • {m.duration} • <span className="text-emerald-700">Anupan: {m.anupan}</span></div>
                                        {m.type === 'combination' && m.ingredients && (<div className="text-[10px] text-slate-400 mt-1">Contains: {m.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit}`).join(', ')}</div>)}
                                    </div>
                                    <button onClick={()=>setRxForm({...rxForm, medicines:rxForm.medicines.filter((_,idx)=>idx!==i)})} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Advice & Plan</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4"><div className="col-span-2"><AutoSuggest label="Pathya / Apathya" items={masters.pathyas} value={rxForm.pathya} onChange={v=>setRxForm({...rxForm, pathya:v})} placeholder="Diet..."/></div><div><label className="text-xs font-bold text-slate-500 uppercase">Follow Up</label><input type="text" className="w-full p-2 border rounded bg-white" value={rxForm.followUp} onChange={e=>setRxForm({...rxForm, followUp:e.target.value})} placeholder="Date or Duration"/></div><div><label className="text-xs font-bold text-slate-500 uppercase bg-white">Notes</label><input className="w-full p-2 border rounded bg-white" value={rxForm.notes} onChange={e=>setRxForm({...rxForm, notes:e.target.value})} placeholder="Rest..."/></div></div>
                        <button onClick={handleSave} className="w-full bg-emerald-800 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-emerald-900 transition-transform active:scale-95">SAVE & FINISH</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MasterManagement = ({ masters, onAdd, onDelete, onUploadCSV }) => {
    const [activeTab, setActiveTab] = useState('medicines');
    const [newItem, setNewItem] = useState({ name: '', type: 'Vati', stock: 0, english: '' });
    
    return (
        <div className="w-full h-full flex flex-col space-y-6">
            <h2 className="text-2xl font-bold font-serif text-emerald-900 flex items-center gap-2 shrink-0"><Database/> Master Data Management</h2>
            <div className="flex gap-2 overflow-x-auto border-b border-emerald-200 pb-1 shrink-0">
                {[{id:'medicines', label:'Medicines', icon: Pill}, {id:'diagnoses', label:'Diagnoses', icon: Activity}, {id:'nidans', label:'Nidan (Cause)', icon: Target}, {id:'symptoms', label:'Symptoms', icon: HeartPulse}, {id:'anupans', label:'Anupan', icon: Leaf}, {id:'pathyas', label:'Pathya', icon: CheckSquare}].map(tab => (
                    <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`px-4 py-2 rounded-t-lg flex items-center gap-2 font-medium transition-colors ${activeTab===tab.id ? 'bg-white text-emerald-700 border-t border-x border-emerald-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}><tab.icon size={16}/> {tab.label}</button>
                ))}
            </div>
            <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-emerald-200 space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-end bg-emerald-50 p-4 rounded-lg shrink-0">
                    <div className="flex gap-2 items-end w-full">
                        <div className="flex-1"><label className="text-xs font-bold text-emerald-800 uppercase">New {activeTab.slice(0,-1)} Name</label><input className="w-full p-2 border rounded bg-white" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})} placeholder="Name..."/></div>
                        {activeTab === 'medicines' && (<><div className="w-32"><label className="text-xs font-bold text-emerald-800 uppercase">Type</label><input className="w-full p-2 border rounded bg-white" value={newItem.type} onChange={e=>setNewItem({...newItem, type:e.target.value})} placeholder="Vati/Churna"/></div><div className="w-24"><label className="text-xs font-bold text-emerald-800 uppercase">Stock</label><input type="number" className="w-full p-2 border rounded bg-white" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:parseInt(e.target.value)||0})}/></div></>)}
                        <button onClick={()=>{ onAdd(newItem, activeTab); setNewItem({ name: '', type: 'Vati', stock: 0, english: '' }); }} className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 h-10 flex items-center gap-2"><Plus size={18}/> Add</button>
                    </div>
                </div>
                <div className="flex justify-between items-center border-b pb-2 shrink-0"><h3 className="font-bold text-lg capitalize">{activeTab} List</h3><label className="flex items-center gap-2 cursor-pointer text-xs bg-slate-100 px-3 py-1 rounded border hover:bg-slate-200"><Upload size={14}/> Bulk Upload CSV <input type="file" className="hidden" accept=".csv" onChange={(e)=>onUploadCSV(e, activeTab)}/></label></div>
                <div className="overflow-y-auto flex-1"><table className="w-full text-left text-sm"><thead className="bg-slate-50 sticky top-0"><tr><th className="p-3">Name</th>{activeTab==='medicines' && <th className="p-3">Details</th>}<th className="p-3 text-right">Action</th></tr></thead><tbody className="divide-y">{masters[activeTab]?.map(m => (<tr key={m._id} className="hover:bg-emerald-50"><td className="p-3 font-medium">{m.name}</td>{activeTab==='medicines' && <td className="p-3 text-slate-500">{m.type} • Stock: {m.stock}</td>}<td className="p-3 text-right"><button onClick={()=>onDelete(m._id, activeTab)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
};

const SettingsPanel = ({ settings, onSave, onLogoUpload }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    return (
        <div className="w-full h-full flex justify-center items-start pt-10">
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow border border-emerald-100">
                <h2 className="text-xl font-bold mb-6 font-serif text-emerald-900">Clinic Settings</h2>
                <div className="space-y-4">
                    <input value={localSettings.clinicName} onChange={e=>setLocalSettings({...localSettings, clinicName:e.target.value})} className="w-full p-2 border rounded" placeholder="Clinic Name"/>
                    <input value={localSettings.doctorName} onChange={e=>setLocalSettings({...localSettings, doctorName:e.target.value})} className="w-full p-2 border rounded" placeholder="Doctor Name"/>
                    <div className="grid grid-cols-2 gap-4"><input value={localSettings.doctorPwd} onChange={e=>setLocalSettings({...localSettings, doctorPwd:e.target.value})} className="w-full p-2 border rounded" placeholder="Doctor Pwd"/><input value={localSettings.staffPwd} onChange={e=>setLocalSettings({...localSettings, staffPwd:e.target.value})} className="w-full p-2 border rounded" placeholder="Staff Pwd"/></div>
                    <div><label className="block text-sm font-bold mb-1">Logo Upload</label><input type="file" onChange={e=>onLogoUpload(e, (data)=>setLocalSettings({...localSettings, logoUrl:data}))} className="w-full p-2 border rounded"/></div>
                    <button onClick={()=>onSave(localSettings)} className="w-full bg-emerald-800 text-white py-3 rounded-lg font-bold">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const StaffDashboard = ({ prescriptions, onView, onPrint }) => {
    const [search, setSearch] = useState('');
    const filteredRx = prescriptions.filter(rx => rx.patientName.toLowerCase().includes(search.toLowerCase()) || rx.patientPhone?.includes(search));

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end shrink-0"><h2 className="text-2xl font-bold flex items-center gap-2"><Pill/> Pharmacy Queue</h2><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input className="pl-9 p-2 border rounded-lg w-64 bg-white" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
            <div className="grid gap-4 overflow-y-auto flex-1 content-start">{filteredRx.map((rx) => (<div key={rx._id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center relative"><div><h3 className="font-bold text-lg">{rx.patientName}</h3><p className="text-sm text-teal-600 font-bold">{rx.diagnosis}</p><p className="text-xs text-slate-400">{new Date(rx.date).toLocaleString()}</p></div><div className="text-right flex gap-3 items-center"><div><p className="text-xs font-bold text-emerald-700 uppercase">Collect</p><p className="text-xl font-bold">₹{rx.internalCharges}</p></div><button onClick={()=>onView(rx)} className="p-3 bg-slate-100 rounded-lg"><Eye size={20}/></button><button onClick={()=>onPrint(rx)} className="p-3 bg-teal-600 text-white rounded-lg"><Printer size={20}/></button></div></div>))}</div>
        </div>
    );
};

const AutoSuggest = ({ label, items, value, onChange, placeholder, displayKey = 'name' }) => {
  const [show, setShow] = useState(false);
  const suggestions = useMemo(() => value ? items.filter(item => item[displayKey]?.toLowerCase().includes(value.toLowerCase())) : [], [value, items, displayKey]);
  return (
    <div className="relative group w-full">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>}
      <input value={value} onChange={(e) => { onChange(e.target.value); setShow(true); }} onFocus={() => setShow(true)} className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-black" placeholder={placeholder} />
      {show && value && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-100 rounded shadow-xl mt-1 max-h-48 overflow-auto">{suggestions.map((item, idx) => (<li key={idx} className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm flex justify-between" onClick={() => { onChange(item[displayKey]); setShow(false); }}><span>{item[displayKey]}</span>{item.stock !== undefined && <span className={`text-xs px-2 rounded ${item.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Qty: {item.stock}</span>}</li>))}</ul>
      )}
    </div>
  );
};

const Login = ({ onLogin, settings, serverIp, setServerIp }) => {
  const [role, setRole] = useState('doctor');
  const [password, setPassword] = useState('');
  const [showIp, setShowIp] = useState(false);
  return (
    <div className="h-screen w-full bg-emerald-50 font-sans text-slate-900 flex items-center justify-center">
      <div className="bg-white shadow-2xl w-full h-full flex overflow-hidden">
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-12 relative">
          <div className="w-48 h-48 bg-white/100 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm p-4 overflow-hidden shadow-inner">{settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Leaf className="w-24 h-24 text-emerald-100" />}</div>
          <h1 className="text-5xl font-bold mb-4 text-center font-serif tracking-wide">{settings.clinicName || 'Ayurvedshala'}</h1><div className="absolute bottom-8 text-sm text-emerald-300/50 flex items-center gap-2"><Wifi size={16} /> Server: {serverIp}</div>
        </div>
        <div className="w-full md:w-1/2 p-20 flex flex-col justify-center bg-white">
          {showIp ? (
             <div className="animate-in fade-in slide-in-from-top-4 w-full max-w-md mx-auto"><h2 className="text-3xl font-bold text-slate-800 mb-6">Connection Setup</h2><div className="bg-emerald-50 p-6 rounded-xl mb-6 text-sm text-slate-600">Main Doctor PC IPv4</div><input className="w-full p-4 border rounded-xl font-mono text-xl mb-6" value={serverIp} onChange={(e) => setServerIp(e.target.value)} /><button onClick={() => setShowIp(false)} className="w-full bg-emerald-700 text-white p-4 rounded-xl font-bold text-lg">Save & Return</button></div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); const target = role === 'doctor' ? (settings?.doctorPwd || 'admin') : (settings?.staffPwd || 'staff'); if (password === target) onLogin({ role, name: role === 'doctor' ? (settings?.doctorName || 'Dr. Dimple') : 'Staff' }); else alert('Invalid Code'); }} className="space-y-8 w-full max-w-md mx-auto">
                <div className="mb-10"><h2 className="text-4xl font-bold text-slate-800 mb-2">Welcome</h2><p className="text-lg text-slate-500">Please login to continue</p></div>
                <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => setRole('doctor')} className={`p-4 text-lg font-bold rounded-xl border-2 transition-all ${role === 'doctor' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-white'}`}>Doctor</button><button type="button" onClick={() => setRole('staff')} className={`p-4 text-lg font-bold rounded-xl border-2 transition-all ${role === 'staff' ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white'}`}>Staff</button></div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-5 bg-slate-50 border rounded-xl text-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-black" placeholder="Password" />
                <button className="w-full bg-emerald-700 text-white p-5 rounded-xl font-bold text-xl shadow-lg hover:bg-emerald-800 transition-all">Login</button>
                <div className="text-center pt-4"><button type="button" onClick={() => setShowIp(true)} className="text-sm text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-2 mx-auto"><Wifi size={16} /> Configure Connection</button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [viewRx, setViewRx] = useState(null);
  const [historyPatientId, setHistoryPatientId] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [serverIp, setServerIp] = useState(() => localStorage.getItem('ayur_server_ip') || 'localhost');
  const apiUrl = `http://${serverIp}:5000/api`;

  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [settings, setSettings] = useState({ clinicName: 'Ayurvedshala', logoUrl: '' });
  const [masters, setMasters] = useState({ medicines: [], diagnoses: [], nidans: [], symptoms: [], anupans: [], pathyas: [] });
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => { localStorage.setItem('ayur_server_ip', serverIp); }, [serverIp]);

  const fetchData = async () => {
    try {
      const [pat, rx, med, diag, nid, sym, anu, path, set] = await Promise.all([
        fetch(`${apiUrl}/patients`).then(r => r.json()),
        fetch(`${apiUrl}/prescriptions`).then(r => r.json()),
        fetch(`${apiUrl}/medicines`).then(r => r.json()),
        fetch(`${apiUrl}/diagnoses`).then(r => r.json()),
        fetch(`${apiUrl}/nidans`).then(r => r.json()),
        fetch(`${apiUrl}/symptoms`).then(r => r.json()),
        fetch(`${apiUrl}/anupans`).then(r => r.json()),
        fetch(`${apiUrl}/pathyas`).then(r => r.json()),
        fetch(`${apiUrl}/settings`).then(r => r.json())
      ]);
      setPatients(pat);
      setPrescriptions(rx.sort((a,b) => new Date(b.date) - new Date(a.date)));
      setMasters({ medicines: med, diagnoses: diag, nidans: nid, symptoms: sym, anupans: anu, pathyas: path });
      setSettings(set);
    } catch (e) { console.error("API Error", e); }
  };

  useEffect(() => {
    const twScript = document.createElement('script'); twScript.src = "https://cdn.tailwindcss.com"; document.head.appendChild(twScript);
    if (!window.jspdf) { const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; script.async = true; document.body.appendChild(script); }
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [apiUrl]);

  const fetchPatientHistory = async (id) => { const res = await fetch(`${apiUrl}/prescriptions/patient/${id}`); setPatientHistory(await res.json()); setHistoryPatientId(id); };
  
  const handleAddPatient = async (p) => { await fetch(`${apiUrl}/patients`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(p) }); fetchData(); alert('Patient Added'); };
  
  const handleSavePrescription = async (payload) => {
      if(!selectedPatient) return alert("Select patient");
      const finalPayload = { ...payload, patientId: selectedPatient._id, patientName: selectedPatient.name, patientAge: selectedPatient.age, patientGender: selectedPatient.gender, patientPhone: selectedPatient.phone, doctorName: user.name };
      const res = await fetch(`${apiUrl}/prescriptions`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(finalPayload) });
      if(res.ok) { setSelectedPatient(null); setView('dashboard'); fetchData(); alert('Rx Saved'); } else alert('Save Failed');
  };

  const handleMasterActions = {
      add: async (item, type) => { await fetch(`${apiUrl}/${type}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(item) }); fetchData(); },
      delete: async (id, type) => { if(confirm('Delete?')) { await fetch(`${apiUrl}/${type}/${id}`, { method: 'DELETE' }); fetchData(); } },
      upload: (e, type) => {
          const file = e.target.files[0]; if(!file) return;
          const reader = new FileReader();
          reader.onload = async (evt) => {
              const rows = evt.target.result.split('\n').slice(1);
              let bulkData = type==='medicines' ? rows.map(r=>{const[n,t,s]=r.split(','); return n?{name:n.trim(),type:t?.trim(),stock:parseInt(s)||0}:null}).filter(Boolean) : rows.map(r=>r.trim()?{name:r.split(',')[0].trim()}:null).filter(Boolean);
              await fetch(`${apiUrl}/${type}/bulk`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(bulkData) }); fetchData(); alert('Uploaded');
          };
          reader.readAsText(file);
      }
  };

  const handleSaveSettings = async (s) => {
      const { _id, ...clean } = s;
      await fetch(`${apiUrl}/settings`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(clean) });
      fetchData(); alert('Settings Saved');
  };

  const handleLogoUpload = (e, callback) => {
      const file = e.target.files[0];
      if(file) { const reader = new FileReader(); reader.onloadend = () => callback(reader.result); reader.readAsDataURL(file); }
  };

  if (!user) return <Login onLogin={setUser} settings={settings} serverIp={serverIp} setServerIp={setServerIp} />;

  return (
    <div className="flex h-screen bg-emerald-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar user={user} view={view} setView={setView} onLogout={()=>setUser(null)} settings={settings}/>
      <div className="flex-1 overflow-auto p-4">
        {user.role === 'doctor' && view === 'dashboard' && <DoctorDashboard patients={patients} prescriptions={prescriptions} onAddPatient={handleAddPatient} onSelectPatient={(p)=>{setSelectedPatient(p); setView('new-rx')}} onViewRx={setViewRx} onPrintRx={(rx)=>generatePDF(rx, settings)}/>}
        {user.role === 'doctor' && view === 'new-rx' && (
            selectedPatient ? 
            <PrescriptionModule patient={selectedPatient} onClose={()=>setSelectedPatient(null)} onSave={handleSavePrescription} masters={masters} onViewHistory={()=>fetchPatientHistory(selectedPatient._id)}/> :
            <div className="flex-1 flex items-center justify-center text-slate-400">Please select a patient from the Dashboard first.</div>
        )}
        {user.role === 'doctor' && view === 'masters' && <MasterManagement masters={masters} onAdd={handleMasterActions.add} onDelete={handleMasterActions.delete} onUploadCSV={handleMasterActions.upload}/>}
        {user.role === 'doctor' && view === 'settings' && <SettingsPanel settings={settings} onSave={handleSaveSettings} onLogoUpload={handleLogoUpload}/>}
        {user.role === 'staff' && <StaffDashboard prescriptions={prescriptions} onView={setViewRx} onPrint={(rx)=>generatePDF(rx, settings)}/>}

        {/* MODALS */}
        {historyPatientId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
                    <div className="p-4 bg-slate-100 border-b flex justify-between items-center sticky top-0"><h3 className="font-bold text-lg">Patient History</h3><button onClick={()=>{setHistoryPatientId(null); setPatientHistory([])}}><X size={20}/></button></div>
                    <div className="p-6 space-y-4">{patientHistory.map(h => (<div key={h._id} className="border p-4 rounded-lg bg-slate-50"><div className="flex justify-between mb-2"><span className="font-bold text-teal-700">{new Date(h.date).toLocaleDateString()}</span><span className="text-sm text-slate-500">Dx: {h.diagnosis}</span></div><ul className="text-sm list-disc pl-4 text-slate-700">{h.medicines.map((m,i)=><li key={i}>{m.name} ({m.dose})</li>)}</ul></div>))}</div>
                </div>
            </div>
        )}
        {viewRx && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center"><h3 className="font-bold">Details</h3><button onClick={()=>setViewRx(null)}><X size={20}/></button></div>
                    <div className="p-6 space-y-4"><div className="flex justify-between border-b pb-4"><div><p className="text-xs text-slate-400">Patient</p><p className="font-bold">{viewRx.patientName}</p></div></div><div><h4 className="font-bold mb-2 text-sm text-slate-600">Medicines</h4><ul className="space-y-2">{viewRx.medicines.map((m,i)=>(<li key={i} className="text-sm border p-2 rounded flex justify-between flex-col"><div className="flex justify-between w-full font-bold"><span>{m.name}</span><span className="text-slate-500 font-normal">{m.dose} • {m.freq}</span></div>{m.type==='combination' && m.ingredients && <div className="text-xs text-emerald-700 mt-1 bg-emerald-50 p-1 rounded"><strong>Mix:</strong> {m.ingredients.map(ing=>`${ing.name} ${ing.amount}${ing.unit}`).join(' + ')}</div>}</li>))}</ul></div></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}