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

  // Calcul de la date du jour au format YYYY-MM-DD
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];  // Format : YYYY-MM-DD
    setStartDate(formattedDate); // Initialiser la date de début
    setEndDate(formattedDate);   // Initialiser la date de fin
  }, []);

  const getSourceCount = () => {
    const counts = data.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {});
    return counts;
  };

  // Fonction pour filtrer les données en fonction de la période sélectionnée
  const filterDataByDate = () => {
    return data.filter(item => {
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

  // Appliquer le filtrage de données avant de calculer les valeurs pour le graphique à barres
  const filteredData = filterDataByDate(); // Applique le filtrage des données

  // Regrouper les données par source pour chaque jour et compter le nombre de liens malicieux par source
  const groupedBySource = filteredData.reduce((acc, item) => {
    const date = item.date.split('T')[0]; // Extraire la date sans l'heure
    if (!acc[item.source]) {
      acc[item.source] = 0;
    }
    acc[item.source] += 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(getSourceCount()),
    datasets: [{
      data: Object.values(getSourceCount()),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    }],
  };
  
  const pieOptions = {
    responsive: true,  // Permet au graphique de s'adapter à la taille de l'écran
    maintainAspectRatio: false, // Désactive le ratio d'aspect pour contrôler la taille du graphique
    plugins: {
      legend: {
        position: 'top', // Position des légendes
        labels: {
          boxWidth: 20, // Taille des cases de la légende
          padding: 15,
        }
      }
    },
    aspectRatio: 1, // Cette option permet de forcer un graphique circulaire avec un ratio 1:1
  };

  const barData = {
    labels: Object.keys(groupedBySource),
    datasets: [{
      label: 'Nombre total de liens malicieux par source',
      data: Object.values(groupedBySource),
      backgroundColor: '#36A2EB',
    }],
  };
  
  const barOptions = {
    responsive: true, // Pour que le graphique soit responsive
    maintainAspectRatio: false, // Permet de contrôler la taille
    height: 400, // Taille personnalisée pour le graphique
  };

  const last50Entries = data
  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Trie les données par date descendante
  .slice(0, 50);

  // Appliquer le filtrage `showMaliciousOnly` uniquement aux 50 dernières entrées
  const filteredLast50Entries = last50Entries.filter(entry => !showMaliciousOnly || entry.is_safe === false);

  return (
    <div className="App">
      <h1>Visualisation des données</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="data-container">
        {/* Conteneur flex pour les deux graphiques */}
        <div className="charts-row">
          <div className="chart-container">
            <h3>Nombre total de liens malicieux par source</h3>
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="chart-container">
            <h3>Nombre de liens malicieux par source et par date</h3>

            {/* Sélecteurs de dates intégrés au deuxième graphique */}
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

        {/* Section des 50 dernières données */}
        <div className="last-entries-container">
          <div className="header-with-checkbox">
            <h3>Les 50 derniers liens les plus récents</h3>
            <label style={{ marginLeft: '20px' }}>
              <input
                type="checkbox"
                checked={showMaliciousOnly}
                onChange={(e) => setShowMaliciousOnly(e.target.checked)}
              />
              Malicieux uniquement
            </label>
          </div>
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
              {filteredLast50Entries.map((entry, index) => {
                // Si la source est "CRAWLER" et l'URL ne commence pas par "http", on ajoute "https://"
                const modifiedUrl = entry.source === 'CRAWLER' && !entry.url.startsWith('http') ? 'https://' + entry.url : entry.url;
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{entry.source}</td>
                    <td>
                      <a
                        href={modifiedUrl}  // Utiliser l'URL modifiée ici pour le lien
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {modifiedUrl}  {/* Afficher l'URL modifiée dans la cellule du tableau */}
                      </a>
                    </td>
                    <td>{entry.date}</td>
                    <td>{entry.is_safe !== null ? entry.is_safe.toString() : 'Not yet checked'}</td>
                    <td>
                      {entry.screenshot ? (
                        <a href={entry.screenshot} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      ) : (
                        'null'
                      )}
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
