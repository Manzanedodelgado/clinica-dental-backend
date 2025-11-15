// Accounting Management System
class AccountingManager {
    constructor() {
        this.currentPeriod = 'current-month';
        this.financialData = {};
        this.expenses = [];
        this.init();
    }

    init() {
        this.loadMockData();
        this.setupEventListeners();
        this.renderDashboard();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Period selector
        const periodSelector = document.getElementById('accountingPeriod');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.updatePeriodData();
                this.renderDashboard();
                this.updateCharts();
            });
        }

        // Export data buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-export]')) {
                const format = e.target.getAttribute('data-export');
                this.exportData(format);
            }
        });

        // Add expense button
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-add-expense]')) {
                this.showAddExpenseModal();
            }
        });
    }

    loadMockData() {
        // Mock financial data
        this.financialData = {
            'current-month': {
                income: {
                    total: 34560,
                    breakdown: {
                        'Consulta General': 12400,
                        'Limpieza Dental': 8900,
                        'Implantes': 15600,
                        'Ortodoncia': 8200,
                        'Endodoncia': 3400,
                        'Otros Tratamientos': 5600
                    },
                    growth: 12.5
                },
                expenses: {
                    total: 12890,
                    breakdown: {
                        'Material Dental': 4200,
                        'Salarios': 3500,
                        'Alquiler': 1800,
                        'Servicios': 890,
                        'Marketing': 650,
                        'Mantenimiento': 850,
                        'Otros': 1000
                    },
                    growth: 8.2
                },
                profit: 21670,
                profitGrowth: 15.3
            },
            'last-month': {
                income: {
                    total: 30720,
                    breakdown: {
                        'Consulta General': 11200,
                        'Limpieza Dental': 7800,
                        'Implantes': 13500,
                        'Ortodoncia': 7500,
                        'Endodoncia': 3200,
                        'Otros Tratamientos': 5200
                    }
                },
                expenses: {
                    total: 11900,
                    breakdown: {
                        'Material Dental': 3800,
                        'Salarios': 3500,
                        'Alquiler': 1800,
                        'Servicios': 850,
                        'Marketing': 600,
                        'Mantenimiento': 800,
                        'Otros': 550
                    }
                },
                profit: 18820
            },
            'current-year': {
                income: {
                    total: 345600,
                    breakdown: {
                        'Consulta General': 124000,
                        'Limpieza Dental': 89000,
                        'Implantes': 156000,
                        'Ortodoncia': 82000,
                        'Endodoncia': 34000,
                        'Otros Tratamientos': 56000
                    }
                },
                expenses: {
                    total: 142900,
                    breakdown: {
                        'Material Dental': 42000,
                        'Salarios': 42000,
                        'Alquiler': 21600,
                        'Servicios': 10560,
                        'Marketing': 7800,
                        'Mantenimiento': 10200,
                        'Otros': 8740
                    }
                },
                profit: 202700
            }
        };

        // Mock expenses data
        this.expenses = [
            {
                id: 1,
                date: '2024-12-15',
                description: 'Material dental - Implantes Straumann',
                category: 'Material Dental',
                amount: 850.50,
                receipt: 'F20241215001.pdf',
                status: 'pending'
            },
            {
                id: 2,
                date: '2024-12-14',
                description: 'Electricidad y agua',
                category: 'Servicios',
                amount: 125.30,
                receipt: null,
                status: 'paid'
            },
            {
                id: 3,
                date: '2024-12-13',
                description: 'Mantenimiento equipo dental',
                category: 'Mantenimiento',
                amount: 320.00,
                receipt: 'F20241213002.pdf',
                status: 'paid'
            },
            {
                id: 4,
                date: '2024-12-12',
                description: 'Material de oficina',
                category: 'Otros',
                amount: 89.99,
                receipt: null,
                status: 'approved'
            },
            {
                id: 5,
                date: '2024-12-11',
                description: 'Marketing Google Ads',
                category: 'Marketing',
                amount: 150.00,
                receipt: 'F20241211003.pdf',
                status: 'paid'
            }
        ];

        // Generate monthly evolution data
        this.generateMonthlyData();
    }

    generateMonthlyData() {
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        this.monthlyEvolution = months.map((month, index) => {
            const baseIncome = 25000;
            const baseExpenses = 11000;
            const variation = Math.sin(index / 12 * Math.PI * 2) * 0.3;
            
            return {
                month,
                income: Math.round(baseIncome * (1 + variation)),
                expenses: Math.round(baseExpenses * (1 + variation * 0.7)),
                profit: Math.round((baseIncome - baseExpenses) * (1 + variation * 1.2))
            };
        });
    }

    renderDashboard() {
        this.updateSummaryCards();
        this.updateExpensesList();
    }

    updateSummaryCards() {
        const data = this.financialData[this.currentPeriod];
        if (!data) return;

        const cards = document.querySelectorAll('.summary-card .amount');
        if (cards.length >= 4) {
            cards[0].textContent = `${data.income.total.toLocaleString()}€`;
            cards[1].textContent = `${this.getPendingPayments().toLocaleString()}€`;
            cards[2].textContent = `${data.expenses.total.toLocaleString()}€`;
            cards[3].textContent = `${data.profit.toLocaleString()}€`;
        }

        // Update change indicators
        this.updateChangeIndicators(data);
    }

    updateChangeIndicators(data) {
        const lastPeriodData = this.getLastPeriodData();
        if (!lastPeriodData) return;

        const changeElements = document.querySelectorAll('.change');
        if (changeElements.length >= 4) {
            // Income change
            this.updateChangeElement(changeElements[0], data.income.total, lastPeriodData.income.total);
            
            // Pending payments change (assuming constant for demo)
            changeElements[1].textContent = 'Sin cambios';
            changeElements[1].className = 'change neutral';
            
            // Expenses change
            this.updateChangeElement(changeElements[2], data.expenses.total, lastPeriodData.expenses.total, true);
            
            // Profit change
            this.updateChangeElement(changeElements[3], data.profit, lastPeriodData.profit);
        }
    }

    updateChangeElement(element, current, previous, inverse = false) {
        const change = ((current - previous) / previous) * 100;
        const isPositive = inverse ? change < 0 : change > 0;
        
        element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}% vs mes anterior`;
        element.className = `change ${isPositive ? 'positive' : 'negative'}`;
    }

    updateExpensesList() {
        const container = document.querySelector('.expenses-list');
        if (!container) return;

        const pendingExpenses = this.expenses.filter(exp => exp.status === 'pending');
        
        container.innerHTML = pendingExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-category">${expense.category}</div>
                </div>
                <div class="expense-amount">${expense.amount.toFixed(2)}€</div>
                <div class="expense-actions">
                    <button class="btn btn-sm btn-outline" onclick="accountingManager.approveExpense(${expense.id})">
                        Aprobar
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="accountingManager.viewReceipt(${expense.id})">
                        <i class="fas fa-receipt"></i>
                    </button>
                </div>
            </div>
        `).join('') || '<div class="no-expenses">No hay gastos pendientes</div>';
    }

    initializeCharts() {
        setTimeout(() => {
            this.createIncomeChart();
            this.createMonthlyChart();
        }, 100);
    }

    createIncomeChart() {
        const canvas = document.getElementById('incomeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.financialData[this.currentPeriod];
        if (!data) return;

        // Simple bar chart using canvas
        this.drawBarChart(ctx, canvas, data.income.breakdown);
    }

    createMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple line chart
        this.drawLineChart(ctx, canvas, this.monthlyEvolution);
    }

    drawBarChart(ctx, canvas, data) {
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / Object.keys(data).length * 0.8;
        const barSpacing = chartWidth / Object.keys(data).length * 0.2;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Find max value
        const maxValue = Math.max(...Object.values(data));

        // Draw bars
        let x = padding;
        Object.entries(data).forEach(([key, value], index) => {
            const barHeight = (value / maxValue) * (chartHeight - 20);
            const barX = x + (index * (barWidth + barSpacing));
            const barY = canvas.height - padding - barHeight;

            // Bar
            ctx.fillStyle = '#0F74A8';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Label
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(key.split(' ')[0], barX + barWidth/2, canvas.height - 5);
            
            // Value
            ctx.fillText(value.toFixed(0) + '€', barX + barWidth/2, barY - 5);
        });

        // Draw axes
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
    }

    drawLineChart(ctx, canvas, data) {
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Find max value
        const maxValue = Math.max(...data.map(d => d.income));

        // Draw lines
        ctx.strokeStyle = '#0F74A8';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = canvas.height - padding - ((point.income / maxValue) * (chartHeight - 20));

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#0F74A8';
        data.forEach((point, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            const y = canvas.height - padding - ((point.income / maxValue) * (chartHeight - 20));

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Month labels
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(point.month, x, canvas.height - 10);
            ctx.fillStyle = '#0F74A8';
        });

        // Draw axes
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
    }

    updateCharts() {
        // Reinitialize charts with new data
        this.initializeCharts();
    }

    updatePeriodData() {
        // Logic to load data for the selected period
        // This would typically fetch data from a server
        console.log('Updating data for period:', this.currentPeriod);
    }

    getLastPeriodData() {
        const periods = {
            'current-month': 'last-month',
            'last-month': 'two-months-ago',
            'current-year': 'last-year'
        };

        const lastPeriodKey = periods[this.currentPeriod];
        return this.financialData[lastPeriodKey];
    }

    getPendingPayments() {
        // Mock pending payments calculation
        return 8230;
    }

    approveExpense(expenseId) {
        const expense = this.expenses.find(exp => exp.id === expenseId);
        if (expense) {
            expense.status = 'approved';
            this.updateExpensesList();
            
            if (window.dentalApp) {
                window.dentalApp.showNotification(`Gasto "${expense.description}" aprobado`, 'success');
            }
        }
    }

    viewReceipt(expenseId) {
        const expense = this.expenses.find(exp => exp.id === expenseId);
        if (expense && expense.receipt) {
            // In a real app, this would open the receipt
            alert(`Visualizando comprobante: ${expense.receipt}`);
        } else {
            alert('No hay comprobante disponible para este gasto');
        }
    }

    showAddExpenseModal() {
        // In a real app, this would show a modal
        const description = prompt('Descripción del gasto:');
        if (description) {
            const amount = parseFloat(prompt('Importe:'));
            if (amount && amount > 0) {
                const category = prompt('Categoría:', 'Otros') || 'Otros';
                
                this.expenses.push({
                    id: Math.max(...this.expenses.map(exp => exp.id), 0) + 1,
                    date: new Date().toISOString().split('T')[0],
                    description: description,
                    category: category,
                    amount: amount,
                    receipt: null,
                    status: 'pending'
                });

                this.updateExpensesList();
                
                if (window.dentalApp) {
                    window.dentalApp.showNotification('Gasto agregado exitosamente', 'success');
                }
            }
        }
    }

    exportData(format) {
        const data = this.getExportData();
        
        switch (format) {
            case 'excel':
                this.exportToExcel(data);
                break;
            case 'pdf':
                this.exportToPDF(data);
                break;
            case 'csv':
                this.exportToCSV(data);
                break;
        }
    }

    getExportData() {
        const currentData = this.financialData[this.currentPeriod];
        return {
            period: this.currentPeriod,
            financial: currentData,
            expenses: this.expenses,
            monthlyEvolution: this.monthlyEvolution,
            exportDate: new Date().toISOString()
        };
    }

    exportToExcel(data) {
        // In a real app, this would generate an Excel file
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contabilidad_${this.currentPeriod}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        if (window.dentalApp) {
            window.dentalApp.showNotification('Datos exportados a Excel', 'success');
        }
    }

    exportToPDF(data) {
        // In a real app, this would generate a PDF report
        if (window.dentalApp) {
            window.dentalApp.showNotification('Reporte PDF generado', 'success');
        }
    }

    exportToCSV(data) {
        // Convert data to CSV format
        const csv = this.convertToCSV(data);
        const dataBlob = new Blob([csv], {type: 'text/csv'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contabilidad_${this.currentPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        if (window.dentalApp) {
            window.dentalApp.showNotification('Datos exportados a CSV', 'success');
        }
    }

    convertToCSV(data) {
        const financial = data.financial;
        const rows = [
            ['Concepto', 'Importe', 'Porcentaje']
        ];

        // Income breakdown
        Object.entries(financial.income.breakdown).forEach(([concept, amount]) => {
            rows.push([`Ingresos - ${concept}`, amount.toFixed(2), `${(amount/financial.income.total*100).toFixed(1)}%`]);
        });

        rows.push(['Total Ingresos', financial.income.total.toFixed(2), '100%']);
        rows.push([]); // Empty row

        // Expense breakdown
        Object.entries(financial.expenses.breakdown).forEach(([concept, amount]) => {
            rows.push([`Gastos - ${concept}`, amount.toFixed(2), `${(amount/financial.expenses.total*100).toFixed(1)}%`]);
        });

        rows.push(['Total Gastos', financial.expenses.total.toFixed(2), '100%']);
        rows.push([]); // Empty row

        // Summary
        rows.push(['Beneficio Neto', financial.profit.toFixed(2), '']);

        return rows.map(row => row.join(',')).join('\n');
    }

    getTaxReport(year) {
        // Generate tax report for a specific year
        const yearData = this.financialData['current-year']; // Mock data
        
        return {
            year: year,
            totalIncome: yearData.income.total,
            totalExpenses: yearData.expenses.total,
            totalProfit: yearData.profit,
            vatPaid: yearData.expenses.total * 0.21, // Mock VAT calculation
            vatCollected: yearData.income.total * 0.21,
            netVat: (yearData.income.total * 0.21) - (yearData.expenses.total * 0.21)
        };
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    calculateGrowthRate(current, previous) {
        return ((current - previous) / previous) * 100;
    }

    getProfitMargin(profit, income) {
        return (profit / income) * 100;
    }
}

// Initialize Accounting Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.accountingManager = new AccountingManager();
});