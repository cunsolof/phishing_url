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

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.json');
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

  return (
    <div className="App">
      <h1>Visualisation des données</h1>
  
      {error && <p style={{ color: 'red' }}>{error}</p>}
  
      <div className="data-container">
        <h2>Nombre total de liens malicieux par source</h2>
        
        {/* Container du graphique */}
        <div className="chart-container">
          <Pie data={pieData} options={pieOptions} />
        </div>
  
        <h2>Nombre liens malicieux par source et par date</h2>
        
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
  
        <div className="chart-container">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

export default App;
