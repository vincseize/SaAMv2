/**
 * js/chart-manager.js
 * Gestion du graphique circulaire (Chart.js)
 */

function updateChart(filteredAssets) {
    const canvas = document.getElementById('myPieChart');
    
    // Vérifications de sécurité
    if (!canvas || canvas.offsetParent === null) return;

    if (typeof CONFIG_STATUS === 'undefined' || typeof Chart === 'undefined') {
        console.warn("Chart.js ou CONFIG_STATUS non trouvé.");
        return;
    }

    // Calcul des données basé sur les assets filtrés fournis
    const counts = {};
    CONFIG_STATUS.forEach(s => counts[s.code] = 0);
    
    filteredAssets.forEach(item => {
        const code = item.getAttribute('data-status-code');
        if (counts[code] !== undefined) {
            counts[code]++;
        }
    });

    const dataValues = CONFIG_STATUS.map(s => counts[s.code]);
    const labelsWithCounts = CONFIG_STATUS.map(s => `${s.label} (${counts[s.code]})`);
    const colors = CONFIG_STATUS.map(s => s.color);

    try {
        // On utilise l'instance globale myChart définie dans script.js
        if (window.myChart) {
            window.myChart.data.datasets[0].data = dataValues;
            window.myChart.data.labels = labelsWithCounts;
            window.myChart.update('none');
        } else {
            const ctx = canvas.getContext('2d');
            window.myChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labelsWithCounts,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: colors,
                        borderWidth: 1,
                        borderColor: '#2b2e31'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 500 },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                color: '#adb5bd',
                                font: { size: 11, family: "'Segoe UI', sans-serif" }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const value = context.raw;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return ` ${context.label}: ${percentage}%`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du graphique:", error);
    }
}