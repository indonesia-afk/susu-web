import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
  Calculator, FileText, Menu, X, Layers, ArrowRight, RefreshCw, BookOpen, Printer, Trash2, Plus, Settings, Save, Edit3, Sliders, AlertCircle, Check, Info, Scale, Gavel, Book, AlertTriangle, TrendingUp, Sigma, HelpCircle
} from 'lucide-react';

// --- 0. DATA DEFAULT ---

const DEFAULT_FACTORS = {
  education: {
    id: 'education',
    label: "Pendidikan",
    options: [
      { value: 1, label: "SMA / SMK", score: 50 },
      { value: 2, label: "Diploma (D3)", score: 100 },
      { value: 3, label: "Sarjana (S1)", score: 150 },
      { value: 4, label: "Pasca Sarjana (S2/S3)", score: 200 }
    ]
  },
  experience: {
    id: 'experience',
    label: "Pengalaman",
    options: [
      { value: 1, label: "< 1 Tahun", score: 20 },
      { value: 2, label: "1 - 3 Tahun", score: 60 },
      { value: 3, label: "3 - 5 Tahun", score: 100 },
      { value: 4, label: "5 - 10 Tahun", score: 160 },
      { value: 5, label: "> 10 Tahun", score: 220 }
    ]
  },
  complexity: {
    id: 'complexity',
    label: "Kompleksitas Tugas", // Changed from "Usaha Mental"
    options: [
      { value: 1, label: "Rutin", score: 50 },
      { value: 2, label: "Variatif", score: 100 },
      { value: 3, label: "Kompleks", score: 180 },
      { value: 4, label: "Strategis", score: 250 }
    ]
  },
  responsibility: {
    id: 'responsibility',
    label: "Tanggung Jawab",
    options: [
      { value: 1, label: "Staff", score: 50 },
      { value: 2, label: "Supervisor", score: 120 },
      { value: 3, label: "Manager", score: 220 },
      { value: 4, label: "Direktur", score: 350 }
    ]
  }
};

const calculateDetailedScore = (factors, factorMap) => {
  if (!factors || !factorMap) return 0;
  let total = 0;
  Object.keys(factorMap).forEach(key => {
    const selectedVal = factors[key];
    if (factorMap[key]) {
      const option = factorMap[key].options.find(opt => opt.value === selectedVal);
      if (option) total += option.score;
    }
  });
  return total;
};

// --- 1. DATA TEMPLATES ---
const TEMPLATES = {
  startup: {
    name: "UMKM / Startup",
    desc: "Metode Ranking. Struktur ramping.",
    method: 'ranking',
    anchors: { min: 6500000, max: 25000000 },
    jobs: [
      { id: 1, title: "CEO / Founder", score: 1, note: "Pemilik usaha" },
      { id: 2, title: "Head of Tech", score: 2, note: "Produk" },
      { id: 3, title: "Marketing Lead", score: 3, note: "Revenue" },
      { id: 4, title: "Sr. Developer", score: 4, note: "Teknis" },
      { id: 5, title: "Sales Exec", score: 5, note: "Sales" },
      { id: 6, title: "Jr. Developer", score: 6, note: "Support" },
      { id: 7, title: "Admin", score: 7, note: "Ops" },
    ]
  },
  corporate: {
    name: "Korporasi Besar",
    desc: "Metode Poin. Struktur lengkap (18 Jabatan).",
    method: 'point',
    anchors: { min: 5500000, max: 120000000 },
    jobs: [
      // C-Level & Directors
      { id: 1, title: "President Director (CEO)", score: 0, factors: { education: 4, experience: 5, complexity: 4, responsibility: 4 } }, // Score tinggi
      { id: 2, title: "Finance Director (CFO)", score: 0, factors: { education: 4, experience: 5, complexity: 4, responsibility: 4 } },
      { id: 3, title: "Operations Director (COO)", score: 0, factors: { education: 4, experience: 5, complexity: 4, responsibility: 4 } },

      // VP & GM Level
      { id: 4, title: "VP Human Resources", score: 0, factors: { education: 4, experience: 5, complexity: 4, responsibility: 3 } },
      { id: 5, title: "VP Sales & Marketing", score: 0, factors: { education: 4, experience: 5, complexity: 4, responsibility: 3 } },
      { id: 6, title: "General Manager IT", score: 0, factors: { education: 4, experience: 5, complexity: 3, responsibility: 3 } },

      // Managers
      { id: 7, title: "Senior Manager Finance", score: 0, factors: { education: 3, experience: 4, complexity: 3, responsibility: 3 } },
      { id: 8, title: "Manager HRBP", score: 0, factors: { education: 3, experience: 4, complexity: 3, responsibility: 3 } },
      { id: 9, title: "Manager Marketing", score: 0, factors: { education: 3, experience: 4, complexity: 2, responsibility: 3 } },
      { id: 10, title: "Assistant Manager Ops", score: 0, factors: { education: 3, experience: 3, complexity: 2, responsibility: 2 } },

      // Supervisors & Specialists (Individual Contributors)
      { id: 11, title: "Sr. Specialist Tax", score: 0, factors: { education: 3, experience: 4, complexity: 3, responsibility: 1 } }, // High skill, low people mgmt
      { id: 12, title: "Supervisor IT Support", score: 0, factors: { education: 3, experience: 3, complexity: 2, responsibility: 2 } },
      { id: 13, title: "Supervisor Accounting", score: 0, factors: { education: 3, experience: 3, complexity: 2, responsibility: 2 } },

      // Staff / Officers
      { id: 14, title: "Specialist Recruitment", score: 0, factors: { education: 3, experience: 2, complexity: 2, responsibility: 1 } },
      { id: 15, title: "Sales Officer", score: 0, factors: { education: 2, experience: 2, complexity: 1, responsibility: 1 } },
      { id: 16, title: "General Affair Officer", score: 0, factors: { education: 2, experience: 1, complexity: 1, responsibility: 1 } },

      // Support
      { id: 17, title: "Admin Staff", score: 0, factors: { education: 2, experience: 1, complexity: 1, responsibility: 1 } },
      { id: 18, title: "Driver / Messenger", score: 0, factors: { education: 1, experience: 1, complexity: 1, responsibility: 1 } },
    ]
  }
};

// --- 2. KOMPONEN UI DASAR ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const StableNumberInput = ({ value, onChange, className, placeholder, disabled }) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);
  return (
    <input
      type="number"
      value={localValue ?? ''}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

const StableTextInput = ({ value, onChange, className, placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);
  return (
    <input
      type="text"
      value={localValue || ''}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      className={className}
      placeholder={placeholder}
    />
  );
};

const InfoTip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!visible) {
      const rect = btnRef.current.getBoundingClientRect();
      let left = rect.left + (rect.width / 2) - 100;
      if (left < 10) left = 10;
      if (left + 200 > window.innerWidth) left = window.innerWidth - 210;
      setPos({ top: rect.bottom + 8, left: left });
    }
    setVisible(!visible);
  };

  useEffect(() => {
    const close = () => setVisible(false);
    if (visible) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [visible]);

  return (
    <>
      <button ref={btnRef} onClick={toggle} className="inline-flex items-center justify-center w-4 h-4 ml-1 text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full border border-blue-200 hover:bg-blue-200">i</button>
      {visible && (
        <div className="fixed z-[9999] w-56 p-3 text-xs text-white bg-slate-800 rounded shadow-xl animate-in fade-in zoom-in-95 leading-relaxed font-normal" style={{ top: pos.top, left: pos.left }} onClick={(e) => e.stopPropagation()}>
          {text}
          <div className="absolute -top-1 left-1/2 -ml-1 w-2 h-2 bg-slate-800 rotate-45 transform -translate-x-1/2"></div>
        </div>
      )}
    </>
  );
};

// --- MODALS ---

const FactorSettingsModal = ({ factors, isOpen, onClose, onSave }) => {
  const [localFactors, setLocalFactors] = useState({});
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLocalFactors(JSON.parse(JSON.stringify(factors)));
      if (Object.keys(factors).length > 0) setActiveTab(Object.keys(factors)[0]);
    }
  }, [isOpen, factors]);

  const updateOption = (factorKey, idx, field, val) => {
    const newFactors = JSON.parse(JSON.stringify(localFactors));
    newFactors[factorKey].options[idx][field] = field === 'score' ? parseInt(val) : val;
    setLocalFactors(newFactors);
  };

  const addOption = (factorKey) => {
    const newFactors = JSON.parse(JSON.stringify(localFactors));
    const nextVal = newFactors[factorKey].options.length + 1;
    newFactors[factorKey].options.push({ value: nextVal, label: "Level Baru", score: 0 });
    setLocalFactors(newFactors);
  };

  const deleteOption = (factorKey, idx) => {
    const newFactors = JSON.parse(JSON.stringify(localFactors));
    newFactors[factorKey].options.splice(idx, 1);
    setLocalFactors(newFactors);
  };

  const addNewFactor = () => {
    const id = "factor_" + Date.now();
    const newFactors = { ...localFactors };
    newFactors[id] = { id: id, label: "Kriteria Baru", options: [{ value: 1, label: "Level 1", score: 10 }] };
    setLocalFactors(newFactors);
    setActiveTab(id);
  };

  const removeFactor = (key) => {
    const newFactors = { ...localFactors };
    delete newFactors[key];
    setLocalFactors(newFactors);
    if (activeTab === key) setActiveTab(Object.keys(newFactors)[0] || null);
  };

  const updateFactorMeta = (key, field, val) => {
    const newFactors = { ...localFactors };
    newFactors[key][field] = val;
    setLocalFactors(newFactors);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Atur Kriteria & Bobot Penilaian</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r bg-slate-50 overflow-y-auto p-2 space-y-1">
            {Object.entries(localFactors).map(([key, f]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center ${activeTab === key ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-600'}`}>
                <span>{f.label}</span>
              </button>
            ))}
            <button onClick={addNewFactor} className="w-full text-center py-2 mt-2 border-2 border-dashed border-slate-300 rounded text-slate-500 text-xs hover:border-blue-400 hover:text-blue-500 font-bold">+ Tambah Kriteria</button>
          </div>
          <div className="w-2/3 p-6 overflow-y-auto">
            {activeTab && localFactors[activeTab] ? (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Nama Kriteria</label>
                    <input className="w-full p-2 border rounded font-bold text-slate-800" value={localFactors[activeTab].label} onChange={(e) => updateFactorMeta(activeTab, 'label', e.target.value)} />
                  </div>
                  <button onClick={() => removeFactor(activeTab)} className="mt-6 p-2 text-white bg-red-500 hover:bg-red-600 rounded shadow"><Trash2 size={18} /></button>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Level & Bobot Skor</label>
                  <div className="space-y-2">
                    {localFactors[activeTab].options.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-xs text-slate-400 w-4 font-mono">{idx + 1}.</span>
                        <input className="flex-1 p-2 border rounded text-sm" value={opt.label} onChange={(e) => updateOption(activeTab, idx, 'label', e.target.value)} placeholder="Nama Level" />
                        <input type="number" className="w-20 p-2 border rounded text-sm font-bold text-blue-600 text-right" value={opt.score} onChange={(e) => updateOption(activeTab, idx, 'score', e.target.value)} placeholder="Poin" />
                        <button onClick={() => deleteOption(activeTab, idx)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => addOption(activeTab)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-2"><Plus size={12} /> Tambah Level</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 mt-10">Pilih kriteria di sebelah kiri untuk mengedit.</div>
            )}
          </div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm">Batal</button>
          <button onClick={() => onSave(localFactors)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-sm flex items-center gap-2"><Save size={16} /> Simpan Perubahan</button>
        </div>
      </div>
    </div>
  )
}

const JobFactorModal = ({ job, factors, isOpen, onClose, onSave }) => {
  const [localFactors, setLocalFactors] = useState({});
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    if (job) {
      const init = {};
      Object.keys(factors).forEach(k => {
        init[k] = (job.factors && job.factors[k]) ? job.factors[k] : 1;
      });
      setLocalFactors(init);
    }
  }, [job, factors]);

  useEffect(() => {
    setLocalScore(calculateDetailedScore(localFactors, factors));
  }, [localFactors, factors]);

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-blue-900">Pembobotan: {job.title}</h3>
            <p className="text-xs text-blue-600">Pilih level untuk setiap kriteria.</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {Object.entries(factors).map(([key, data]) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                {data.label}
              </label>
              <select
                className="w-full p-2 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={localFactors[key] || 1}
                onChange={(e) => setLocalFactors({ ...localFactors, [key]: parseInt(e.target.value) })}
              >
                {data.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} (+{opt.score})</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 p-4 border-t flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Skor</span>
            <span className="text-xl font-bold text-blue-600">{localScore}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 text-slate-600 text-xs font-bold">Batal</button>
            <button onClick={() => onSave(job.id, localScore, localFactors)} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: Grading Configuration Modal ---
const GradingConfigModal = ({ isOpen, onClose, jobs, evalMethod, onGenerate }) => {
  // State for Point Method
  const [interval, setInterval] = useState(50);
  // State for Ranking Method
  const [gradeCount, setGradeCount] = useState(5);

  const [stats, setStats] = useState({ min: 0, max: 0 });
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (jobs.length > 0) {
      const scores = jobs.map(j => j.score);
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      setStats({ min, max });

      // Initial suggestion
      if (evalMethod === 'point') {
        const range = max - min;
        if (range > 500) setInterval(100);
        else if (range > 200) setInterval(50);
        else setInterval(20);
      } else {
        // Ranking suggestion: 1 grade for every ~2 jobs, min 2, max 15
        const suggested = Math.max(2, Math.min(15, Math.ceil(jobs.length / 2)));
        setGradeCount(suggested);
      }
    }
  }, [jobs, isOpen, evalMethod]);

  useEffect(() => {
    if (jobs.length === 0) return;

    let newPreview = [];

    if (evalMethod === 'point') {
      // --- PREVIEW LOGIC: POINT METHOD ---
      if (stats.max === 0 && stats.min === 0) return;
      const numGrades = Math.ceil(stats.max / interval);

      for (let i = 1; i <= numGrades; i++) {
        const minRange = (i - 1) * interval;
        const maxRange = (i * interval);

        const jobsInGrade = jobs.filter(j => {
          if (i === 1) return j.score >= 0 && j.score <= maxRange;
          return j.score > minRange && j.score <= maxRange;
        });

        if (jobsInGrade.length > 0 || i === numGrades || i === 1) {
          newPreview.push({
            grade: i,
            range: `${minRange + 1} - ${maxRange}`,
            count: jobsInGrade.length,
            jobs: jobsInGrade.map(j => j.title)
          });
        }
      }
      // Filter only relevant grades
      newPreview = newPreview.filter(p => {
        const [minP, maxP] = p.range.split(' - ').map(Number);
        return maxP >= stats.min;
      });

    } else {
      // --- PREVIEW LOGIC: RANKING METHOD ---
      // Sorted Ascending by Score (Rank 1 = Score 1)
      // Note: In Ranking method data structure, lower score number usually means Higher Rank (Rank 1 is CEO).
      // But logic needs Grade 1 (Lowest) to Grade N (Highest).

      // Sort jobs: Rank 1 (CEO) to Rank N (Admin)
      let sortedJobs = [...jobs].sort((a, b) => a.score - b.score);

      // We want Grade 1 to have the lowest ranked jobs (Highest Rank Number).
      // So we reverse the sorted array: [Rank N, Rank N-1 ... Rank 1]
      const reversedJobs = [...sortedJobs].reverse();

      const jobsPerGrade = Math.ceil(reversedJobs.length / gradeCount);

      for (let i = 0; i < gradeCount; i++) {
        const startIdx = i * jobsPerGrade;
        const chunk = reversedJobs.slice(startIdx, startIdx + jobsPerGrade);

        // If chunk is empty (because math.ceil made too many buckets), skip or merge?
        // For preview we show what we have.
        if (chunk.length > 0) {
          newPreview.push({
            grade: i + 1, // Grade 1 is first chunk (lowest ranks)
            range: `Rank ${chunk[chunk.length - 1].score} - ${chunk[0].score}`,
            count: chunk.length,
            jobs: chunk.map(j => j.title)
          });
        }
      }
    }

    setPreview(newPreview);

  }, [interval, gradeCount, stats, jobs, evalMethod]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><Sliders size={20} /> Konfigurasi Golongan</h3>
            <p className="text-xs text-slate-500">
              {evalMethod === 'point' ? "Tentukan rentang skor untuk membagi golongan." : "Tentukan jumlah golongan yang diinginkan."}
            </p>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Stats Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <span className="text-xs text-blue-600 font-bold uppercase">
                {evalMethod === 'point' ? "Skor Terendah" : "Rank Terendah (Job)"}
              </span>
              <div className="text-2xl font-bold text-blue-900">{stats.min}</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
              <span className="text-xs text-indigo-600 font-bold uppercase">
                {evalMethod === 'point' ? "Skor Tertinggi" : "Rank Tertinggi (Job)"}
              </span>
              <div className="text-2xl font-bold text-indigo-900">{stats.max}</div>
            </div>
          </div>

          {/* Controls based on Method */}
          <div className="mb-6">
            {evalMethod === 'point' ? (
              <>
                <label className="block text-sm font-bold text-slate-700 mb-2">Interval Skor per Golongan</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="10" max="200" step="10" value={interval} onChange={(e) => setInterval(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="w-28 relative">
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(parseInt(e.target.value))}
                      className="w-full p-2 pr-10 border border-slate-300 rounded text-right font-bold text-blue-700"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-bold">pts</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Semakin kecil interval, semakin banyak golongan terbentuk.</p>
              </>
            ) : (
              <>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Golongan Target</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="2" max={Math.min(15, jobs.length)} step="1" value={gradeCount} onChange={(e) => setGradeCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="w-24">
                    <input type="number" value={gradeCount} onChange={(e) => setGradeCount(parseInt(e.target.value))} className="w-full p-2 border border-slate-300 rounded text-center font-bold text-blue-700" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Sistem akan membagi jabatan secara merata ke dalam jumlah golongan ini.</p>
              </>
            )}
          </div>

          {/* Live Preview */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 border-b pb-1">Pratinjau Hasil Pembagian</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {preview.length === 0 ? (
                <div className="text-slate-400 text-sm italic text-center py-4">Data tidak valid untuk diproses.</div>
              ) : (
                preview.map((p, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 rounded text-sm ${p.count === 0 ? 'bg-slate-50 text-slate-400 border border-dashed' : 'bg-white border border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs ${p.count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                        {p.grade}
                      </span>
                      <div>
                        <div className="font-bold">{evalMethod === 'point' ? `Range: ${p.range}` : `Rank: ${p.range}`}</div>
                        <div className="text-[10px] truncate max-w-[200px]">
                          {p.jobs.length > 0 ? p.jobs.join(", ") : "Tidak ada jabatan"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${p.count === 0 ? 'text-slate-400' : 'text-green-600'}`}>{p.count}</span>
                      <span className="text-[10px] ml-1">Jabatan</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {preview.some(p => p.count === 0) && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle size={14} /> Ada golongan kosong.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm">Batal</button>
          <button onClick={() => onGenerate(evalMethod === 'point' ? interval : gradeCount)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-sm flex items-center gap-2 shadow-lg shadow-blue-200">
            <Check size={16} /> Terapkan & Buat Struktur
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3. APLIKASI UTAMA ---

export default function App() {
  const [activeTab, setActiveTab] = useState('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State UI
  const [showSettings, setShowSettings] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);

  // State Data
  const [config, setConfig] = useState({ companyName: "eSPeJe Ecosystem Corp.", ump: 5729876 });
  const [factorMap, setFactorMap] = useState(DEFAULT_FACTORS);
  const [jobs, setJobs] = useState([]);
  const [evalMethod, setEvalMethod] = useState('point');
  const [signatories, setSignatories] = useState({
    creator: { name: '(Nama Jelas)', title: 'HR Manager' },
    approver: { name: '(Nama Jelas)', title: 'Direktur Utama' }
  });

  // Calculator Data
  const [anchors, setAnchors] = useState({ minMidpoint: 6500000, maxMidpoint: 20000000 });
  const [grades, setGrades] = useState([]);

  // Auto Scroll to Top on Tab Change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Helpers
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Simulasi SUSU ${config.companyName || ''}`;
    window.print();
    document.title = originalTitle;
  };

  // Print Date String Generator
  const getPrintDateString = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
    return `Dicetak pada: ${dateStr} - ${timeStr} WIB`;
  };

  // --- LOGIC ---

  const loadTemplate = (key) => {
    const t = TEMPLATES[key];
    if (t) {
      setAnchors({ minMidpoint: t.anchors.min, maxMidpoint: t.anchors.max });
      const processedJobs = JSON.parse(JSON.stringify(t.jobs)).map(job => {
        if (t.method === 'point' && job.factors) {
          job.score = calculateDetailedScore(job.factors, factorMap);
        }
        return job;
      });
      setJobs(processedJobs);
      setEvalMethod(t.method || 'point');
      setGrades([]);
      setActiveTab('prep');
      setMobileMenuOpen(false);
    }
  };

  const resetData = () => {
    setAnchors({ minMidpoint: 6500000, maxMidpoint: 0 });
    setJobs([]);
    setGrades([]);
    setMobileMenuOpen(false);
  };

  const handleSaveFactorsSettings = (newFactors) => {
    setFactorMap(newFactors);
    setShowSettings(false);
    const updatedJobs = jobs.map(job => ({
      ...job,
      score: calculateDetailedScore(job.factors, newFactors)
    }));
    setJobs(updatedJobs);
  };

  const addJob = () => {
    const nextId = jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1;
    const defaultScore = evalMethod === 'point' ? 0 : jobs.length + 1;
    const defaultFactors = {};
    Object.keys(factorMap).forEach(k => defaultFactors[k] = 1);

    setJobs([...jobs, {
      id: nextId, title: "Jabatan Baru", score: defaultScore, note: "", factors: defaultFactors
    }]);
  };

  const updateJob = (id, field, val) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, [field]: val } : j));
  };

  const removeJob = (id) => setJobs(jobs.filter(j => j.id !== id));

  // --- LOGIKA UTAMA GENERATOR ---

  const handleGenerateClick = () => {
    if (jobs.length === 0) { alert("Input jabatan dulu!"); return; }
    setShowGradingModal(true);
  };

  const handleConfigSubmit = (configValue) => {
    if (evalMethod === 'point') {
      generateGradesPointMethod(configValue);
    } else {
      generateGradesRankingMethod(configValue);
    }
  };

  // LOGIKA 1: METODE RANKING (Sederhana, dibagi rata)
  const generateGradesRankingMethod = (targetGradeCount) => {
    setShowGradingModal(false);

    let sorted = [...jobs].sort((a, b) => a.score - b.score); // Ascending for rank (1 is top)
    const sortedForProcessing = [...sorted].reverse(); // Lowest rank (Admin) first for Grade 1

    const newGrades = [];
    const jobsPerGrade = Math.ceil(sorted.length / targetGradeCount);

    // Default Values Logic
    const startMid = config.ump * 1.1; // Sedikit di atas UMP
    const step = 2000000;

    for (let i = 0; i < sortedForProcessing.length; i += jobsPerGrade) {
      const chunk = sortedForProcessing.slice(i, i + jobsPerGrade);
      if (chunk.length === 0) continue;

      const gradeId = newGrades.length + 1;
      const spread = 20 + (gradeId * 5);

      // FIX: Math.round agar tidak desimal
      const mid = Math.round(startMid + ((gradeId - 1) * step));

      const spreadDec = spread / 100;
      const min = Math.round((2 * mid) / (spreadDec + 2));
      const max = Math.round((mid * 2 * (spreadDec + 1)) / (spreadDec + 2));

      newGrades.push({
        id: gradeId, name: `Golongan ${gradeId}`, spread: Math.min(spread, 100), mid, min, max, overlap: 0,
        jobTitles: chunk.map(j => j.title)
      });
    }

    finalizeGeneration(newGrades);
  };

  // LOGIKA 2: METODE POIN DENGAN INTERVAL (User Defined)
  const generateGradesPointMethod = (interval) => {
    setShowGradingModal(false);

    const scores = jobs.map(j => j.score);
    const minScoreData = Math.min(...scores);
    const maxScoreData = Math.max(...scores);
    const numGrades = Math.ceil(maxScoreData / interval);

    const newGrades = [];
    const startMid = config.ump * 1.15; // Start

    let currentMid = startMid;

    for (let i = 1; i <= numGrades; i++) {
      const minRange = (i - 1) * interval;
      const maxRange = i * interval;

      const jobsInGrade = jobs.filter(j => {
        if (i === 1) return j.score >= 0 && j.score <= maxRange;
        return j.score > minRange && j.score <= maxRange;
      });

      if (maxRange < minScoreData && jobsInGrade.length === 0) {
        continue;
      }

      const gradeId = newGrades.length + 1;

      // Midpoint Progression Logic
      if (gradeId > 1) {
        currentMid = currentMid * 1.20;
      }

      const spread = 30 + (gradeId * 2);
      const spreadDec = spread / 100;
      const min = Math.round((2 * currentMid) / (spreadDec + 2));
      const max = Math.round((currentMid * 2 * (spreadDec + 1)) / (spreadDec + 2));

      newGrades.push({
        id: gradeId,
        name: `Golongan ${gradeId}`,
        rangeLabel: `${minRange + 1} - ${maxRange}`,
        spread: Math.min(spread, 100),
        mid: Math.round(currentMid),
        min, max, overlap: 0,
        jobTitles: jobsInGrade.map(j => j.title)
      });
    }

    finalizeGeneration(newGrades);
  };

  const finalizeGeneration = (generatedGrades) => {
    const finalGrades = calculateOverlap(generatedGrades);
    setGrades(finalGrades);
    setActiveTab('calculator');
  };

  const updateGradeCalculation = (updatedGrades) => {
    const recalculated = updatedGrades.map(g => {
      const spreadDec = g.spread / 100;
      const min = Math.round((2 * g.mid) / (spreadDec + 2));
      const max = Math.round((g.mid * 2 * (spreadDec + 1)) / (spreadDec + 2));
      return { ...g, min, max };
    });
    return calculateOverlap(recalculated);
  };

  const calculateOverlap = (gradeList) => {
    return gradeList.map((curr, i) => {
      if (i === 0) return { ...curr, overlap: 0 };
      const prev = gradeList[i - 1];
      const overlapRaw = prev.max - curr.min;
      const rangePrev = prev.max - prev.min;
      const overlap = rangePrev > 0 && overlapRaw > 0 ? parseFloat(((overlapRaw / rangePrev) * 100).toFixed(1)) : 0;
      return { ...curr, overlap };
    });
  };

  const handleGradeUpdate = (id, field, val) => {
    const newGrades = grades.map(g => {
      if (g.id === id) {
        return { ...g, [field]: val };
      }
      return g;
    });
    if (field === 'spread' || field === 'mid') {
      setGrades(updateGradeCalculation(newGrades));
    } else {
      setGrades(newGrades);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 print:p-0 print:m-0 print:bg-white">
      <style>{`
        @media print {
            @page {
                margin: 20mm;
                size: A4;
            }
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .break-inside-avoid {
                page-break-inside: avoid;
            }
            /* HIDE SCROLLBARS IN PRINT */
            ::-webkit-scrollbar {
                display: none;
            }
        }
      `}</style>

      <FactorSettingsModal factors={factorMap} isOpen={showSettings} onClose={() => setShowSettings(false)} onSave={handleSaveFactorsSettings} />

      <JobFactorModal
        job={editingJob}
        factors={factorMap}
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        onSave={(id, s, f) => {
          setJobs(jobs.map(j => j.id === id ? { ...j, score: s, factors: f } : j));
          setShowJobModal(false);
          setEditingJob(null);
        }}
      />

      <GradingConfigModal
        isOpen={showGradingModal}
        jobs={jobs}
        evalMethod={evalMethod}
        onClose={() => setShowGradingModal(false)}
        onGenerate={handleConfigSubmit}
      />

      {/* Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Calculator size={20} className="text-white" /></div>
            <span>SUSU<span className="text-blue-400">Web</span></span>
          </div>

          <div className="hidden md:flex gap-1 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            {[
              { id: 'intro', label: '1. Pengantar & Teori', icon: Info },
              { id: 'prep', label: '2. Analisis & Evaluasi', icon: BookOpen },
              { id: 'calculator', label: '3. Struktur & Skala Upah', icon: Layers },
              { id: 'report', label: '4. Laporan', icon: FileText }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-300 hover:text-white relative z-50">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-slate-800 border-t border-slate-700 shadow-xl z-40">
            {[
              { id: 'intro', label: '1. Pengantar & Teori', icon: Info },
              { id: 'prep', label: '2. Analisis & Evaluasi', icon: BookOpen },
              { id: 'calculator', label: '3. Struktur & Skala Upah', icon: Layers },
              { id: 'report', label: '4. Laporan', icon: FileText }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                className={`w-full text-left p-4 border-b border-slate-700 flex items-center gap-3 ${activeTab === item.id ? 'text-white bg-slate-700 font-bold' : 'text-slate-400'}`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:max-w-none">

        {/* TAB 0: INTRO & THEORY */}
        {activeTab === 'intro' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Info className="text-blue-600" /> Pengantar Struktur & Skala Upah
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p className="mb-6">
                  Struktur dan Skala Upah (SUSU) adalah kewajiban bagi setiap perusahaan di Indonesia. Penyusunan SUSU bertujuan untuk mewujudkan penghasilan yang layak, menjamin keadilan internal, dan mematuhi regulasi ketenagakerjaan terbaru.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Gavel size={18} className="text-blue-600" /> Dasar Hukum Terbaru</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li><strong>PP No. 49 Tahun 2025</strong> (Perubahan Kedua PP 36/2021): Landasan hukum tertinggi saat ini. Menegaskan kewajiban pengusaha menyusun dan menerapkan SUSU untuk menjaga daya beli pekerja dan mewujudkan penghidupan yang layak.</li>
                      <li><strong>PP No. 51 Tahun 2023</strong> (Perubahan Pertama PP 36/2021): Menegaskan bahwa Upah Minimum hanya berlaku untuk masa kerja di bawah 1 tahun.</li>
                      <li><strong>Permenaker No. 1 Tahun 2017</strong>: Pedoman teknis tata cara penyusunan Struktur dan Skala Upah.</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Scale size={18} className="text-green-600" /> Filosofi & Prinsip</h3>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                        <strong className="text-blue-700 block text-sm mb-1">Keadilan Internal (Internal Equity)</strong>
                        <span className="text-xs">"Equal pay for work of equal value". Jabatan dengan bobot lebih besar berhak mendapatkan imbalan lebih besar.</span>
                      </div>
                      <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                        <strong className="text-green-700 block text-sm mb-1">Proporsionalitas (Proportionality)</strong>
                        <span className="text-xs">Sesuai semangat PP 49/2025, kenaikan dan struktur upah harus memperhatikan pertumbuhan ekonomi dan produktivitas nasional/daerah.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 mb-8">
                  <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Implikasi Hukum & Sanksi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong className="text-amber-800 block mb-1">Pembedaan Masa Kerja</strong>
                      <p>Pekerja dengan masa kerja 1 tahun atau lebih <strong>WAJIB</strong> berpedoman pada Struktur dan Skala Upah, dan tidak boleh lagi hanya menerima Upah Minimum (kecuali struktur upah di level tersebut memang setara UM).</p>
                    </div>
                    <div>
                      <strong className="text-amber-800 block mb-1">Sanksi Administratif</strong>
                      <p>Perusahaan yang tidak menyusun dan memberitahukan SUSU kepada pekerja dapat dikenai sanksi mulai dari teguran tertulis hingga pembekuan kegiatan usaha (sesuai Permenaker 1/2017).</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2"><Book size={18} className="text-indigo-600" /> Definisi Penting</h3>
                <ul className="space-y-3 text-sm border-l-2 border-indigo-100 pl-4">
                  <li>
                    <strong className="text-slate-900 block">Struktur Upah</strong>
                    Susunan tingkat upah dari yang terendah sampai yang tertinggi atau sebaliknya.
                  </li>
                  <li>
                    <strong className="text-slate-900 block">Skala Upah</strong>
                    Kisaran nilai nominal upah untuk setiap golongan jabatan (Min - Mid - Max).
                  </li>
                  <li>
                    <strong className="text-slate-900 block">Golongan Jabatan</strong>
                    Pengelompokan jabatan berdasarkan nilai atau bobot jabatan hasil evaluasi jabatan.
                  </li>
                </ul>
              </div>
            </Card>

            {/* NEW SECTION: Kamus Teknis & Strategi */}
            <Card className="p-6 border-slate-300">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <HelpCircle size={22} className="text-purple-600" /> Kamus Teknis & Strategi Kompensasi
              </h3>

              <div className="space-y-6">
                {/* Spread & Midpoint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-purple-700 mb-2">Spread (Rentang)</h4>
                    <p className="text-sm text-slate-700 mb-2">Selisih antara gaji minimum dan maksimum dalam satu golongan jabatan, dinyatakan dalam persentase.</p>
                    <div className="text-xs bg-white p-2 rounded border border-slate-200 text-slate-600">
                      <strong>Contoh:</strong> Jika Min = 5 Juta dan Spread = 50%, maka Max = 7,5 Juta. Spread yang lebih lebar biasanya diberikan untuk jabatan level manajerial.
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-blue-700 mb-2">Midpoint (Nilai Tengah)</h4>
                    <p className="text-sm text-slate-700 mb-2">Nilai tengah antara gaji minimum dan maksimum. Ini adalah target gaji pasar (market rate) untuk posisi tersebut bagi karyawan yang kompeten sepenuhnya.</p>
                    <div className="text-xs bg-white p-2 rounded border border-slate-200 text-slate-600">
                      <strong>Rumus:</strong> Mid = (Min + Max) / 2.
                    </div>
                  </div>
                </div>

                {/* Overlap Detailed Explanation */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="font-bold text-slate-900 text-lg mb-3 border-b pb-2">Overlap (Tumpang Tindih)</h4>

                  <p className="text-sm text-slate-700 mb-4">
                    Overlap adalah persentase rentang gaji di mana gaji maksimum pada golongan bawah lebih tinggi daripada gaji minimum pada golongan di atasnya.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="font-bold text-sm text-slate-800 mb-2">Mengapa Ada Overlap? (Filosofi)</h5>
                      <div className="bg-purple-50 p-3 rounded-lg text-sm text-slate-700 space-y-2">
                        <p>Overlap diciptakan secara sengaja untuk mengakomodasi realitas berikut:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Menghargai Pengalaman:</strong> Seorang karyawan senior yang sangat berpengalaman di level Staff (Golongan 1) wajar jika memiliki gaji yang lebih tinggi daripada seorang Supervisor baru (Golongan 2) yang belum berpengalaman.</li>
                          <li><strong>Fleksibilitas Penggajian:</strong> Memberikan ruang bagi perusahaan untuk menaikkan gaji karyawan yang berprestasi tanpa harus mempromosikan mereka ke jabatan yang lebih tinggi jika belum ada lowongan.</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-800 mb-2">Bedah Makna: "Overlap &gt; 50% berarti kenaikan gaji promosi kecil"</h5>
                      <div className="bg-amber-50 p-3 rounded-lg text-sm text-slate-700">
                        <p className="mb-2"><strong>Skenario 1: Overlap Besar (80%)</strong></p>
                        <p className="text-xs mb-1">Staff (5-15 Juta) vs SPV (6-18 Juta). Budi (Staff Senior) gaji 14 Juta dipromosikan ke SPV. Karena range SPV mulai dari 6 Juta, gaji 14 Juta Budi sudah aman. Kenaikan gaji mungkin cuma 5-10%.</p>
                        <p className="mb-2 mt-3"><strong>Skenario 2: Overlap Kecil (10%)</strong></p>
                        <p className="text-xs">Staff (5-8 Juta) vs SPV (7.5-12 Juta). Siti (Staff Senior) gaji 8 Juta dipromosikan. Karena range SPV tinggi, dia butuh kenaikan signifikan agar posisinya mantap.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5 className="font-bold text-sm text-slate-800 mb-2">Panduan Angka Overlap Ideal</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="border border-green-200 bg-green-50 p-3 rounded">
                        <strong className="text-green-800 block mb-1">Overlap Sedang (30% - 50%)</strong>
                        <p>Ideal (Sweet Spot). Menyeimbangkan penghargaan masa kerja dengan insentif promosi.</p>
                      </div>
                      <div className="border border-amber-200 bg-amber-50 p-3 rounded">
                        <strong className="text-amber-800 block mb-1">Overlap Tinggi (50% - 70%)</strong>
                        <p>Efisiensi biaya, karir landai. Cocok untuk level Staff/Admin. Resiko: Motivasi promosi rendah.</p>
                      </div>
                      <div className="border border-blue-200 bg-blue-50 p-3 rounded">
                        <strong className="text-blue-800 block mb-1">Overlap Kecil (&lt; 20%)</strong>
                        <p>Lonjakan gaji besar saat promosi. Cocok untuk Manajerial ke Eksekutif. Resiko: Senior level bawah bisa frustasi.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-slate-800 mb-2">Rumus di Aplikasi</h5>
                    <div className="flex justify-center items-center gap-2 font-mono text-sm text-slate-700 bg-slate-100 p-3 rounded overflow-x-auto">
                      <span className="whitespace-nowrap">Overlap % =</span>
                      <div className="flex flex-col items-center">
                        <span className="border-b border-slate-400 pb-1 whitespace-nowrap">(Max Bawah - Min Atas)</span>
                        <span className="pt-1 whitespace-nowrap">(Max Bawah - Min Bawah)</span>
                      </div>
                      <span>× 100</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">Jika hasilnya Negatif, berarti tidak ada overlap (ada celah kosong/gap), yang mana ini kurang baik karena artinya ada "zona mati".</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Metode Evaluasi Jabatan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-colors bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 p-2 rounded-lg text-xs font-bold">1. Metode Ranking</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Membandingkan satu jabatan dengan jabatan lain secara keseluruhan untuk menentukan urutan (peringkat) dari yang tertinggi hingga terendah. Sangat sederhana namun kurang objektif untuk organisasi besar.
                  </p>
                  <div className="text-xs font-bold text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded">Cocok untuk: UMKM / Startup</div>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-colors bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg text-xs font-bold">2. Metode Poin (Point Factor)</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Memberikan nilai poin pada setiap jabatan berdasarkan faktor-faktor penentu (compensable factors) seperti pendidikan, pengalaman, kompleksitas tugas, dll. Lebih analitis, objektif, dan dapat dipertanggungjawabkan.
                  </p>
                  <div className="text-xs font-bold text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded">Cocok untuk: Perusahaan Menengah - Besar</div>
                </div>
              </div>
            </Card>

            <button onClick={() => setActiveTab('prep')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2 group transition-all">
              Mulai Analisis Jabatan <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* TAB 1: PREPARATION */}
        {activeTab === 'prep' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">Analisis dan Evaluasi Jabatan</h2>
                  <div className="text-blue-100 text-sm mt-1">
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Tentukan kriteria dan bobot penilaian.</li>
                      <li>Tentukan nama dan nilai jabatan.</li>
                      <li>Tentukan interval skor atau target golongan.</li>
                    </ol>
                  </div>
                </div>
                <button onClick={() => setShowSettings(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-white/20"><Settings size={16} /> Atur Kriteria</button>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/20 mt-4 relative z-10">
                <div className="text-xs font-bold text-blue-200 mb-2 uppercase flex items-center gap-2"><RefreshCw size={12} /> Load Template:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TEMPLATES).map(([k, t]) => (
                    <button key={k} onClick={() => loadTemplate(k)} className="px-3 py-1 bg-white text-slate-900 text-xs font-bold rounded hover:bg-blue-100 transition shadow-sm">{t.name}</button>
                  ))}
                  <button onClick={resetData} className="px-3 py-1 bg-red-500/80 text-white text-xs font-bold rounded hover:bg-red-600">Reset</button>
                </div>
              </div>
            </div>

            {/* Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => setEvalMethod('ranking')} className={`cursor-pointer p-4 rounded-xl border-2 text-left transition ${evalMethod === 'ranking' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <h3 className="font-bold text-slate-800">Metode Ranking <InfoTip text="Urutkan manual dari rank 1 (tertinggi)" /></h3>
                <p className="text-xs text-slate-500 mt-1">Cocok untuk UMKM. Cepat & Sederhana.</p>
              </div>
              <div onClick={() => setEvalMethod('point')} className={`cursor-pointer p-4 rounded-xl border-2 text-left transition ${evalMethod === 'point' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <h3 className="font-bold text-slate-800">Metode Poin <InfoTip text="Hitung skor berdasarkan faktor (Pendidikan dll)" /></h3>
                <p className="text-xs text-slate-500 mt-1">Cocok untuk Korporasi. Lebih objektif.</p>
              </div>
            </div>

            {/* Job Table */}
            <Card className="p-0 overflow-hidden">
              <div className="p-4 bg-slate-100 border-b flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Inventaris Jabatan</h3>
                <button onClick={addJob} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1"><Plus size={16} /> Tambah Jabatan</button>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3 min-w-[200px]">Nama Jabatan <InfoTip text="Isi nama jabatan sesuai struktur organisasi" /></th>
                      {evalMethod === 'point' ? (
                        <>
                          <th className="p-3 min-w-[200px]">Detail Faktor <InfoTip text="Klik Edit untuk atur bobot (S1, Pengalaman, dll)" /></th>
                          <th className="p-3 w-32 text-center">Total Skor</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 min-w-[200px]">Justifikasi <InfoTip text="Alasan kenapa jabatan ini penting" /></th>
                          <th className="p-3 w-24 text-center">Ranking <InfoTip text="1 = Tertinggi" /></th>
                        </>
                      )}
                      <th className="p-3 w-16 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job, idx) => (
                      <tr key={job.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <StableTextInput value={job.title} onChange={(v) => updateJob(job.id, 'title', v)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" placeholder="Nama Jabatan..." />
                        </td>
                        {evalMethod === 'point' ? (
                          <>
                            <td className="p-2">
                              <button onClick={() => { setEditingJob(job); setShowJobModal(true); }} className="w-full text-left p-2 bg-white border border-slate-300 rounded text-xs text-slate-600 hover:border-blue-500 flex justify-between items-center group">
                                <span>{job.factors ? `🎓${factorMap.education?.options.find(o => o.value === job.factors.education)?.label.substr(0, 3) || '?'}...` : "Set Bobot"}</span>
                                <span className="text-blue-500 font-bold group-hover:underline flex items-center gap-1"><Edit3 size={12} /> Edit</span>
                              </button>
                            </td>
                            <td className="p-2 text-center"><span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{job.score}</span></td>
                          </>
                        ) : (
                          <>
                            <td className="p-2"><StableTextInput value={job.note} onChange={(v) => updateJob(job.id, 'note', v)} className="w-full p-2 border border-slate-300 rounded text-xs" placeholder="Alasan..." /></td>
                            <td className="p-2"><StableNumberInput value={job.score} onChange={(v) => updateJob(job.id, 'score', parseInt(v))} className="w-full p-2 border border-slate-300 rounded text-center font-bold text-blue-700" placeholder="#" /></td>
                          </>
                        )}
                        <td className="p-2 text-center"><button onClick={() => removeJob(job.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <button onClick={handleGenerateClick} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2">
              Generate SUSU <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* TAB 2: CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Chart Section with UMP Bar - FIX MOBILE VIEW */}
            <Card className="p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white p-3 rounded-lg shadow gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-bold text-blue-400 whitespace-nowrap">Parameter UMP:</span>
                  <div className="flex items-center bg-slate-800 border border-slate-600 rounded px-2 w-full sm:w-40">
                    <span className="text-slate-400 text-sm mr-1">Rp.</span>
                    <StableNumberInput
                      value={config.ump}
                      onChange={(v) => setConfig({ ...config, ump: v })}
                      className="bg-transparent border-none w-full text-center font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center sm:text-right w-full sm:w-auto">
                  Grafik menyesuaikan tabel di bawah.
                </div>
              </div>

              <div className="h-[300px] w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={grades} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-10}
                      textAnchor="end"
                      height={40}
                      interval={0}
                    />
                    <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} width={35} tick={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(v) => formatRupiah(v)} />
                    <Line type="monotone" dataKey="mid" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="min" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="max" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* NEW: TECHNICAL EXPLANATION FOR CHART */}
            <Card className="p-6 bg-slate-50 border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" /> Analisis Grafik Struktur & Skala Upah
              </h3>
              <div className="space-y-4 text-sm text-slate-600">
                <p>
                  Grafik di atas merepresentasikan <strong>Garis Kebijakan Upah (Wage Policy Line)</strong> perusahaan Anda.
                  Garis biru solid menunjukkan nilai tengah (Midpoint) yang ideal untuk setiap golongan, sedangkan garis putus-putus menunjukkan batas rentang (Range) gaji minimum dan maksimum yang wajar.
                </p>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <strong className="text-slate-800 block mb-2 flex items-center gap-2"><Sigma size={16} /> Teori & Rumus Dasar</strong>
                  <p className="mb-2">
                    Dalam praktik remunerasi modern dan sesuai Lampiran <strong>Permenaker No. 1 Tahun 2017</strong> (Metode Regresi), garis kebijakan upah yang ideal umumnya ditarik menggunakan persamaan garis lurus:
                  </p>
                  <div className="bg-slate-100 p-3 rounded font-mono text-center text-slate-800 font-bold my-3 border border-slate-300">
                    $$Y = a + b(X)$$
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>$Y$ (Upah)</strong>: Variabel terikat, yaitu nominal gaji yang dihasilkan.</li>
                    <li><strong>$X$ (Golongan Jabatan)</strong>: Variabel bebas, yaitu bobot atau ranking jabatan.</li>
                    <li><strong>$a$ (Intercept)</strong>: Titik potong sumbu Y, merepresentasikan upah dasar terendah (biasanya di sekitar UMP).</li>
                    <li><strong>$b$ (Slope)</strong>: Kemiringan garis, menunjukkan seberapa agresif kenaikan gaji antar golongan. Semakin curam slope, semakin besar perbedaan gaji antara level bawah dan atas.</li>
                  </ul>
                </div>

                <p className="text-xs italic text-slate-500 mt-2">
                  *Catatan: Sistem ini menggunakan pendekatan progresif di mana kenaikan midpoint mungkin berbentuk eksponensial (melengkung ke atas) untuk mengakomodasi tanggung jawab yang semakin besar di level jabatan tinggi, sesuai praktik terbaik HR.
                </p>
              </div>
            </Card>

            {/* Table Editor */}
            <Card className="overflow-hidden border-slate-300 shadow-md">
              <div className="p-4 bg-slate-100 border-b font-bold text-slate-700 flex justify-between items-center">
                <div>
                  <span>Tabel SUSU</span>
                  <div className="text-[10px] font-normal text-slate-500 mt-1">Ubah Midpoint atau Spread secara langsung di tabel.</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600 text-xs uppercase">
                    <tr>
                      <th className="p-3 min-w-[120px]">Golongan</th>
                      {evalMethod === 'point' && <th className="p-3 text-center min-w-[100px] text-slate-400">Range Poin</th>}
                      <th className="p-3 min-w-[200px]">Spread <InfoTip text="Jarak (%) antara Gaji Min dan Max. Semakin tinggi jabatan, spread biasanya semakin besar (40-60%)." /></th>
                      <th className="p-3 text-right min-w-[120px]">Min</th>
                      <th className="p-3 text-center min-w-[140px] bg-blue-50 text-blue-900 border-x border-blue-200">Midpoint (Input) <InfoTip text="Nilai tengah target gaji pasaran. Ubah angka ini untuk menyesuaikan kurva gaji." /></th>
                      <th className="p-3 text-right min-w-[120px]">Max</th>
                      <th className="p-3 text-center">Overlap <InfoTip text="Persentase tumpang tindih dengan grade di bawahnya. Overlap > 50% berarti kenaikan gaji saat promosi kecil." /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grades.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 group">
                        <td className="p-2">
                          <div className="font-bold text-slate-700">{row.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{row.jobTitles?.join(", ")}</div>
                        </td>
                        {evalMethod === 'point' && (
                          <td className="p-2 text-center text-xs text-slate-500 font-mono bg-slate-50 border-r">{row.rangeLabel}</td>
                        )}
                        {/* SPREAD CONTROLS */}
                        <td className="p-2 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <input type="range" min="0" max="200" value={row.spread} onChange={(e) => handleGradeUpdate(row.id, 'spread', parseInt(e.target.value))} className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <StableNumberInput value={row.spread} onChange={(v) => handleGradeUpdate(row.id, 'spread', parseInt(v))} className="w-10 text-center border border-slate-300 rounded text-xs py-1" />
                            <span className="text-xs">%</span>
                          </div>
                        </td>
                        <td className={`p-2 text-right font-mono ${row.min < config.ump ? 'text-red-600 font-bold bg-red-50' : ''}`}>{formatRupiah(row.min)}</td>
                        {/* MIDPOINT EDITABLE */}
                        <td className="p-2 text-right bg-blue-50 border-x border-blue-100">
                          <StableNumberInput
                            value={row.mid}
                            onChange={(v) => handleGradeUpdate(row.id, 'mid', parseInt(v))}
                            className="w-full text-right bg-transparent border-b border-blue-200 focus:border-blue-600 outline-none font-bold text-blue-900 px-1 py-1"
                          />
                        </td>
                        <td className="p-2 text-right font-mono">{formatRupiah(row.max)}</td>
                        <td className="p-2 text-center text-xs">
                          <span className={`px-2 py-1 rounded ${row.overlap > 50 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{row.overlap}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <button onClick={() => setActiveTab('report')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2">
              Lanjut ke Laporan <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* TAB 3: REPORT */}
        {activeTab === 'report' && (
          <div className="bg-white p-8 shadow-lg border rounded-xl animate-in fade-in slide-in-from-bottom-4 print:shadow-none print:border-none">
            <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
              <h1 className="text-2xl font-bold uppercase text-slate-900">STRUKTUR DAN SKALA UPAH</h1>
              <StableTextInput
                value={config.companyName}
                onChange={(v) => setConfig({ ...config, companyName: v })}
                className="text-center w-full text-lg text-slate-600 mt-2 font-medium bg-transparent border-none focus:ring-0 placeholder-slate-300"
                placeholder="Masukkan Nama Perusahaan"
              />
              <p className="text-xs text-slate-400 mt-2">{getPrintDateString()}</p>
            </div>

            {/* Tabel A: Struktur Upah - WRAPPED IN OVERFLOW-X-AUTO */}
            <div className="mb-8 break-inside-avoid">
              <h3 className="font-bold text-slate-800 mb-2 pl-3 border-l-4 border-slate-800">A. Tabel Struktur dan Skala Upah</h3>
              <div className="overflow-x-auto border border-slate-300 rounded-sm">
                <table className="w-full text-sm min-w-[600px] print:min-w-0">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border">Golongan</th>
                      {evalMethod === 'point' && <th className="p-2 border bg-slate-50">Interval Poin</th>}
                      <th className="p-2 border">Min</th>
                      <th className="p-2 border">Mid</th>
                      <th className="p-2 border">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 border">{r.name}</td>
                        {evalMethod === 'point' && <td className="p-2 border text-center bg-slate-50 text-slate-500">{r.rangeLabel}</td>}
                        <td className="p-2 border text-right">{formatRupiah(r.min)}</td>
                        <td className="p-2 border text-right">{formatRupiah(r.mid)}</td>
                        <td className="p-2 border text-right">{formatRupiah(r.max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NEW: Chart in Report (Same as Calculator tab, non-interactive) */}
            <div className="mb-8 break-inside-avoid print:break-inside-avoid">
              <h3 className="font-bold text-slate-800 mb-2 pl-3 border-l-4 border-slate-800">B. Grafik Struktur dan Skala Upah</h3>
              <div className="overflow-x-auto print:overflow-visible">
                {/* CHART FIX: Fixed width 640px to fit A4 page without resizing logic issues */}
                <div style={{ width: '640px', height: '350px' }} className="border border-slate-300 rounded p-4 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={grades} margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                        interval={0} // Ensure all labels show
                      />
                      <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} width={40} tick={{ fontSize: 10 }} />
                      <Line isAnimationActive={false} type="monotone" dataKey="mid" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                      <Line isAnimationActive={false} type="monotone" dataKey="min" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                      <Line isAnimationActive={false} type="monotone" dataKey="max" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabel B: Detail Jabatan (NEW) - WRAPPED IN OVERFLOW-X-AUTO */}
            <div className="mb-8 break-inside-avoid">
              <h3 className="font-bold text-slate-800 mb-2 pl-3 border-l-4 border-slate-800">C. Detail Jabatan per Golongan</h3>
              <div className="overflow-x-auto border border-slate-300 rounded-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border w-1/4">Golongan</th>
                      <th className="p-2 border w-auto">Daftar Jabatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 border font-bold align-top bg-slate-50">{r.name}</td>
                        <td className="p-2 border">
                          {r.jobTitles && r.jobTitles.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {r.jobTitles.map((title, idx) => (
                                <li key={idx}>{title}</li>
                              ))}
                            </ul>
                          ) : <span className="text-slate-400 italic">- Tidak ada jabatan -</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 text-center text-sm mt-12 break-inside-avoid">
              <div className="flex flex-col items-center">
                <p className="mb-10">Dibuat Oleh,</p>
                <StableTextInput
                  value={signatories.creator.name}
                  onChange={(v) => setSignatories({ ...signatories, creator: { ...signatories.creator, name: v } })}
                  className="text-center font-bold border-b border-black w-full pb-1 outline-none"
                />
                <StableTextInput
                  value={signatories.creator.title}
                  onChange={(v) => setSignatories({ ...signatories, creator: { ...signatories.creator, title: v } })}
                  className="text-center text-xs mt-1 outline-none w-full"
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="mb-10">Disetujui Oleh,</p>
                <StableTextInput
                  value={signatories.approver.name}
                  onChange={(v) => setSignatories({ ...signatories, approver: { ...signatories.approver, name: v } })}
                  className="text-center font-bold border-b border-black w-full pb-1 outline-none"
                />
                <StableTextInput
                  value={signatories.approver.title}
                  onChange={(v) => setSignatories({ ...signatories, approver: { ...signatories.approver, title: v } })}
                  className="text-center text-xs mt-1 outline-none w-full"
                />
              </div>
            </div>

            <div className="text-center print:hidden mt-8">
              <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 mx-auto"><Printer size={20} /> Cetak PDF</button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">

          {/* Powered by */}
          <p className="text-xs text-slate-400">
            Powered by{" "}
            <a
              href="https://espeje.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline transition-colors"
            >
              espeje.com
            </a>{" "}
            &{" "}
            <a
              href="https://link-gr.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline transition-colors"
            >
              link-gr.id
            </a>
          </p>

          {/* Main text */}
          <p className="text-sm">
            Lihat aplikasi² lain yang bisa mempermudah kerjaanmu di{" "}
            <a
              href="https://link-gr.id/tomhub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-bold transition-colors"
            >
              TOMHUB
            </a>
          </p>

        </div>
      </footer>
    </div>
  );
}