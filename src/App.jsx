import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Plus, Trash2, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GoogleAdsTracker = () => {
  const [entries, setEntries] = useState([]);
  const [usdRate, setUsdRate] = useState(5.65);
  const [manualRate, setManualRate] = useState('');
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    gastoReal: '',
    faturamentoUSD: ''
  });
  const [view, setView] = useState('daily');

  // Buscar cotação do dólar
  useEffect(() => {
    fetchUSDRate();
  }, []);

  const fetchUSDRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.BRL) {
        setUsdRate(data.rates.BRL);
      }
    } catch (error) {
      console.log('Usando cotação padrão');
    }
  };

  const addEntry = () => {
    if (newEntry.gastoReal && newEntry.faturamentoUSD) {
      const entry = {
        id: Date.now(),
        date: newEntry.date,
        gastoReal: parseFloat(newEntry.gastoReal),
        faturamentoUSD: parseFloat(newEntry.faturamentoUSD),
        faturamentoReal: parseFloat(newEntry.faturamentoUSD) * usdRate,
        lucro: (parseFloat(newEntry.faturamentoUSD) * usdRate) - parseFloat(newEntry.gastoReal)
      };
      setEntries([...entries, entry].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setNewEntry({ date: new Date().toISOString().split('T')[0], gastoReal: '', faturamentoUSD: '' });
    }
  };

  const deleteEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateRate = () => {
    if (manualRate) {
      const newRate = parseFloat(manualRate);
      setUsdRate(newRate);
      setEntries(entries.map(e => ({
        ...e,
        faturamentoReal: e.faturamentoUSD * newRate,
        lucro: (e.faturamentoUSD * newRate) - e.gastoReal
      })));
    }
  };

  // Cálculos
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);
  const last7Days = entries.filter(e => {
    const entryDate = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const calcTotals = (data) => ({
    gastoReal: data.reduce((sum, e) => sum + e.gastoReal, 0),
    faturamentoUSD: data.reduce((sum, e) => sum + e.faturamentoUSD, 0),
    faturamentoReal: data.reduce((sum, e) => sum + e.faturamentoReal, 0),
    lucro: data.reduce((sum, e) => sum + e.lucro, 0)
  });

  const dailyTotals = calcTotals(todayEntries);
  const weeklyTotals = calcTotals(last7Days);
  const monthlyTotals = calcTotals(monthEntries);

  const roi = monthlyTotals.gastoReal > 0 ? ((monthlyTotals.lucro / monthlyTotals.gastoReal) * 100) : 0;

  // Dados para gráficos
  const chartData = entries.slice(0, 30).reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2d', month: '2d' }),
    'Gasto (R$)': e.gastoReal,
    'Faturamento (R$)': e.faturamentoReal,
    'Lucro (R$)': e.lucro
  }));

  const pieData = [
    { name: 'Gasto', value: monthlyTotals.gastoReal },
    { name: 'Lucro', value: monthlyTotals.lucro > 0 ? monthlyTotals.lucro : 0 }
  ];

  const COLORS = ['#ef4444', '#22c55e'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <DollarSign className="text-green-600" />
          Controle Google Ads - USD/BRL
        </h1>

        {/* Conversor de Dólar */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Cotação do Dólar
          </h2>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cotação Atual</label>
              <div className="text-3xl font-bold text-green-600">
                R$ {usdRate.toFixed(4)}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Atualizar Manualmente</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={manualRate}
                  onChange={(e) => setManualRate(e.target.value)}
                  placeholder="Ex: 5.65"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={updateRate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Adicionar Entrada */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="text-green-600" />
            Adicionar Registro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gasto (R$)</label>
              <input
                type="number"
                step="0.01"
                value={newEntry.gastoReal}
                onChange={(e) => setNewEntry({...newEntry, gastoReal: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faturamento (USD)</label>
              <input
                type="number"
                step="0.01"
                value={newEntry.faturamentoUSD}
                onChange={(e) => setNewEntry({...newEntry, faturamentoUSD: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addEntry}
                className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Hoje
            </h3>
            <div className="space-y-2 text-sm">
              <p>Gasto: <span className="font-bold">R$ {dailyTotals.gastoReal.toFixed(2)}</span></p>
              <p>Faturamento: <span className="font-bold">$ {dailyTotals.faturamentoUSD.toFixed(2)}</span></p>
              <p>Faturamento: <span className="font-bold">R$ {dailyTotals.faturamentoReal.toFixed(2)}</span></p>
              <p className={`text-lg font-bold ${dailyTotals.lucro >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                Lucro: R$ {dailyTotals.lucro.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Últimos 7 Dias</h3>
            <div className="space-y-2 text-sm">
              <p>Gasto: <span className="font-bold">R$ {weeklyTotals.gastoReal.toFixed(2)}</span></p>
              <p>Faturamento: <span className="font-bold">$ {weeklyTotals.faturamentoUSD.toFixed(2)}</span></p>
              <p>Faturamento: <span className="font-bold">R$ {weeklyTotals.faturamentoReal.toFixed(2)}</span></p>
              <p className={`text-lg font-bold ${weeklyTotals.lucro >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                Lucro: R$ {weeklyTotals.lucro.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Mês Atual</h3>
            <div className="space-y-2 text-sm">
              <p>Gasto: <span className="font-bold">R$ {monthlyTotals.gastoReal.toFixed(2)}</span></p>
              <p>Faturamento: <span className="font-bold">$ {monthlyTotals.faturamentoUSD.toFixed(2)}</span></p>
              <p>Faturamento: <span className="font-bold">R$ {monthlyTotals.faturamentoReal.toFixed(2)}</span></p>
              <p className={`text-lg font-bold ${monthlyTotals.lucro >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                Lucro: R$ {monthlyTotals.lucro.toFixed(2)}
              </p>
              <p className="text-lg font-bold text-yellow-200">ROI: {roi.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução Diária (Últimos 30 dias)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Gasto (R$)" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Faturamento (R$)" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Lucro (R$)" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Comparativo Mensal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Gasto', value: monthlyTotals.gastoReal },
                { name: 'Faturamento', value: monthlyTotals.faturamentoReal },
                { name: 'Lucro', value: monthlyTotals.lucro }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição Gasto vs Lucro */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição Gasto vs Lucro (Mês)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de Registros */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Registros</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-right py-3 px-4">Gasto (R$)</th>
                  <th className="text-right py-3 px-4">Faturamento (USD)</th>
                  <th className="text-right py-3 px-4">Faturamento (R$)</th>
                  <th className="text-right py-3 px-4">Lucro (R$)</th>
                  <th className="text-center py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                    <td className="text-right py-3 px-4 text-red-600 font-semibold">
                      R$ {entry.gastoReal.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                      $ {entry.faturamentoUSD.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                      R$ {entry.faturamentoReal.toFixed(2)}
                    </td>
                    <td className={`text-right py-3 px-4 font-bold ${entry.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {entry.lucro.toFixed(2)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && (
              <p className="text-center py-8 text-gray-500">Nenhum registro ainda. Adicione seu primeiro registro acima!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsTracker;
