'use client';

import { useState } from 'react';
import { Field, Select, Button, Input, Badge } from '@/components/ui/FormFields';
import { CreditCard, Search, ArrowRight, Wallet, User as UserIcon, Receipt } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function CashierPage() {
  const [search, setSearch] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bills, setBills] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    setLoadingSearch(true);
    setStudent(null);
    setBills([]);
    
    try {
      // Fake search endpoint call
      const res = await fetch(`/api/billing/cashier-search?q=${search}`);
      const data = await res.json();
      if (res.ok && data.student) {
        setStudent(data.student);
        setBills(data.bills);
      } else {
        toast.error('Siswa tidak ditemukan');
      }
    } catch {
      toast.error('Gagal mencari data');
    }
    setLoadingSearch(false);
  };

  const fmt = (n: number | string) => {
    return 'Rp ' + parseFloat(n as string).toLocaleString('id-ID');
  };

  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  
  const toggleBill = (id: number) => {
    setSelectedBills(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalSelected = bills.filter(b => selectedBills.includes(b.id)).reduce((acc, b) => acc + (parseFloat(b.total_amount) - parseFloat(b.paid_amount)), 0);

  const processPayment = async () => {
    if (selectedBills.length === 0) return;
    const loadId = toast.loading('Memproses pembayaran...');
    try {
      await fetch('/api/billing/process-payment', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billIds: selectedBills, payAmount: totalSelected, method: 'cash' })
      });
      toast.success('Pembayaran Berhasil!', { id: loadId });
      setSelectedBills([]);
      // Reload bills
      const res = await fetch(`/api/billing/cashier-search?q=${student.nis}`);
      const data = await res.json();
      setBills(data.bills);
    } catch {
      toast.error('Payment failed', { id: loadId });
    }
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
      <Toaster position="top-right" richColors />
      
      {/* Left panel / Search */}
      <div className="w-[450px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full shadow-[2px_0_15px_-5px_rgba(0,0,0,0.05)] z-10">
        <div className="p-6 border-b border-slate-100 bg-violet-600/5">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
            <CreditCard className="text-violet-600" /> Mode Kasir
          </h2>
          <p className="text-[13px] text-slate-500 mb-5">Pencarian cepat siswa & tagihan</p>
          
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ketik NIS, NISN, atau Nama Siswa..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-24 py-3.5 text-[14px] outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 shadow-sm"
              autoFocus
            />
            <Button size="sm" loading={loadingSearch} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 py-2">Cari</Button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {!student && !loadingSearch ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Receipt size={64} className="mb-4 opacity-30" strokeWidth={1} />
                <p className="text-[15px] font-medium text-slate-400">Pindai Barcode / Cari NIS</p>
                <p className="text-[12px] mt-1 text-slate-400">untuk mulai menerima pembayaran</p>
             </div>
          ) : student && (
            <div className="space-y-4 animate-fadeIn">
              {/* Student Card */}
              <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-xl font-bold uppercase shrink-0">
                    {student.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{student.full_name}</h3>
                    <div className="flex items-center gap-3 text-[12px] text-slate-300 font-medium font-mono">
                      <span>NIS: {student.nis}</span> • <span>{student.class_name || 'Class N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bills List */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Tagihan Belum Lunas</h4>
                  <span className="text-[12px] font-semibold text-rose-500 px-2 py-0.5 bg-rose-50 rounded-md">
                    {bills.length} item
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {bills.length === 0 ? (
                    <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-center text-[13px] font-medium border-dashed">
                      ✨ Tidak ada tunggakan. Semua lunas!
                    </div>
                  ) : (
                    bills.map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => toggleBill(b.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 hover:shadow-sm
                          ${selectedBills.includes(b.id) 
                            ? 'bg-violet-50 border-violet-300 shadow-[0_0_0_2px_rgba(139,92,246,0.1)]' 
                            : 'bg-white border-slate-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${selectedBills.includes(b.id) ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}>
                          {selectedBills.includes(b.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-[14px] truncate transition-colors ${selectedBills.includes(b.id) ? 'text-violet-800' : 'text-slate-700'}`}>{b.title}</p>
                          <p className="text-[12px] text-slate-400 mt-0.5">{b.product_name || 'Biaya Sekolah'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-bold text-[14.5px] transition-colors ${selectedBills.includes(b.id) ? 'text-violet-700' : 'text-slate-800'}`}>
                            {fmt(parseFloat(b.total_amount) - parseFloat(b.paid_amount))}
                          </p>
                          {parseFloat(b.paid_amount) > 0 && (
                            <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">Cicilan</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side / Payment */}
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className={`w-full max-w-[500px] transition-all duration-500 mt-[-5rem] ${selectedBills.length > 0 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-50 scale-95 translate-y-10 pointer-events-none blur-[1px]'}`}>
          
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 p-6 text-center text-white">
              <p className="text-[13px] font-medium text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2 justify-center"><Wallet size={14}/> Total Bayar Sekarang</p>
              <h1 className="text-[2.5rem] font-bold leading-tight font-mono tracking-tighter">
                {fmt(totalSelected)}
              </h1>
              <p className="text-slate-400 text-[13px] mt-2 font-medium bg-slate-700/50 inline-block px-3 py-1 rounded-full uppercase tracking-wider">{selectedBills.length} Item Terpilih</p>
            </div>
            
            <div className="p-6 space-y-5">
              <Field label="Pilih Metode Pembayaran">
                <Select>
                  <option value="cash">Tunai / Cash</option>
                  <option value="transfer">Transfer Bank Manual</option>
                  <option value="qris">E-Wallet (QRIS)</option>
                </Select>
              </Field>
              
              <Field label="Tanggal Pembayaran">
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </Field>

              <Field label="Uang Diterima">
                <Input type="text" placeholder="Rp 0" defaultValue={fmt(totalSelected).replace('Rp ', '')} className="text-lg font-bold py-3 px-4 h-14" />
              </Field>

              <div className="pt-4 border-t border-slate-100">
                <Button 
                  className="w-full h-14 text-[16px] justify-center shadow-lg shadow-violet-600/20"
                  onClick={processPayment}
                >
                  Proses & Cetak Kuitansi <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
