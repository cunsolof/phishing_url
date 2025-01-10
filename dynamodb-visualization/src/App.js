import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import './App.css';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showMaliciousOnly, setShowMaliciousOnly] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/cunsolof/phishing_url/main/dynamodb-visualization/public/data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (e) {
        setError("Erreur lors du chargement du fichier.");
        console.error(e);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setStartDate(formattedDate);
    setEndDate(formattedDate);
  }, []);

  const filterData = () => {
    return showMaliciousOnly ? data.filter(item => item.is_safe === false) : data;
  };

  const getSourceCount = (filteredData) => {
    const counts = filteredData.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});
    return counts;
  };

  const filterDataByDate = (filteredData) => {
    return filteredData.filter(item => {
      const date = item.date.split('T')[0];
      return date >= startDate && date <= endDate;
    });
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const filteredData = filterData(); // Applique le filtrage selon le bouton
  const dataForCharts = filterDataByDate(filteredData); // Filtre les données selon les dates

  const groupedBySource = dataForCharts.reduce((acc, item) => {
    if (!acc[item.source]) {
      acc[item.source] = 0;
    }
    acc[item.source] += 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(getSourceCount(filteredData)),
    datasets: [{
      data: Object.values(getSourceCount(filteredData)),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 15,
        }
      }
    },
  };

  const barData = {
    labels: Object.keys(groupedBySource),
    datasets: [{
      label: 'Nombre total de liens par source',
      data: Object.values(groupedBySource),
      backgroundColor: '#36A2EB',
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const last50Entries = filteredData
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50);

  return (
    <div className="App">
      <h1>Projet Phishing URL - Visualisation des données</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Bouton Malicieux uniquement */}
      <div className="checkbox-container">
        <label>
          <input
            type="checkbox"
            checked={showMaliciousOnly}
            onChange={(e) => setShowMaliciousOnly(e.target.checked)}
          />
          Malicieux uniquement
        </label>
      </div>

      <div className="data-container">
        {/* Graphiques */}
        <div className="charts-row">
          <div className="chart-container">
            <h3>Nombre total de liens par source</h3>
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="chart-container">
            <h3>Nombre de liens par source et par date</h3>
            <div className="date-picker-container">
              <label htmlFor="start-date">Date de début:</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={handleStartDateChange}
              />
              <label htmlFor="end-date">Date de fin:</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={handleEndDateChange}
              />
            </div>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Table des 50 dernières données */}
        <div className="last-entries-container">
          <h3>Les 50 derniers liens les plus récents</h3>
          <table className="last-entries-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Source</th>
                <th>URL</th>
                <th>Date</th>
                <th>is_safe</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {last50Entries.map((entry, index) => {
                const modifiedUrl = entry.source === 'CRAWLER' && !entry.url.startsWith('http') ? 'https://' + entry.url : entry.url;
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{entry.source}</td>
                    <td>
                      <a href={modifiedUrl} target="_blank" rel="noopener noreferrer">{modifiedUrl}</a>
                    </td>
                    <td>{entry.date}</td>
                    <td>{entry.is_safe !== null ? entry.is_safe.toString() : 'Not yet checked'}</td>
                    <td>
                      {entry.screenshot ? (
                        <a href={entry.screenshot} target="_blank" rel="noopener noreferrer">Voir</a>
                      ) : 'null'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
