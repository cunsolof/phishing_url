import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import './App.css';
import { useMemo } from 'react';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showMaliciousOnly, setShowMaliciousOnly] = useState(false);
  const [loading, setLoading] = useState(true); // Variable pour gérer le chargement

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/cunsolof/phishing_url/main/dynamodb-visualization/public/data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData = await response.json();
  
        // Trier une fois pour obtenir la première date
        const sortedData = jsonData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const minDate = new Date(sortedData[0].date);
        const maxDate = new Date(); // Aujourd'hui
  
        setData(sortedData);
        setStartDate(minDate.toISOString().split('T')[0]);
        setEndDate(maxDate.toISOString().split('T')[0]);
        setError(null);
      } catch (e) {
        setError("Erreur lors du chargement du fichier.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
  
    loadData();
  }, []);  

  const filterData = () => {
    return showMaliciousOnly ? data.filter(item => item.is_safe === false) : data;
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

  const filteredData = filterData(); // Filtré uniquement par le bouton "Malicieux uniquement"
  const filteredDataByDate = filterDataByDate(filteredData); // Ajout du filtre de date pour l'histogramme

  const groupedBySourceForBar = useMemo(() => {
    return filteredDataByDate.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});
  }, [filteredDataByDate]);
  
  const groupedBySourceForPie = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});
  }, [filteredData]);

  const pieData = {
    labels: Object.keys(groupedBySourceForPie),
    datasets: [{
      data: Object.values(groupedBySourceForPie),
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
    labels: Object.keys(groupedBySourceForBar),
    datasets: [{
      label: 'Nombre total de liens par source',
      data: Object.values(groupedBySourceForBar),
      backgroundColor: '#36A2EB',
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const last50Entries = filteredData
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="App">
      <h1>Projet Phishing URL - Visualisation des données</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Rond de chargement */}
      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
        </div>
      ) : (
        <>
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

            <div className="last-entries-container">
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
                            <a href={entry.screenshot} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={entry.screenshot} 
                                alt="Screenshot" 
                                style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }} 
                              />
                            </a>
                          ) : 'null'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
