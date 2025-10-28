# Donear Sales Forecasting System (donear_3)

## 📊 Overview

The Donear Sales Forecasting System is a comprehensive sales forecasting dashboard with advanced scenario planning and accuracy analysis. This system allows organizations to:

- Create and manage sales forecasts with confidence metrics
- Track leading indicators that contribute to forecasts
- Test different scenarios with adjustable parameters
- Monitor historical forecast accuracy
- Visualize trends and growth patterns

---

## 🏗️ Architecture

### Database Models

#### 1. **FORECAST_3**
Main forecast data for a specific period.

**Fields:**
- `orgId` - Organization ID
- `period` - Month/Year of forecast
- `totalAmount` - Total forecast amount (in Cr)
- `growthRate` - Year-over-year growth percentage
- `confidence` - Model confidence level (0-100)
- `industryAvgGrowth` - Industry average for comparison
- `benchmarkConfidence` - Benchmark confidence level
- `previousYearAmount` - Last year's actual
- `status` - draft | published | archived
- `notes` - Additional notes

#### 2. **INDICATOR_3**
Leading indicators that contribute to forecast.

**Fields:**
- `orgId` - Organization ID
- `forecast` - Reference to FORECAST_3
- `name` - Indicator name (e.g., "Cotton Price Impact")
- `category` - Category (e.g., "Raw Material", "Market")
- `value` - Current value
- `contribution` - Contribution to forecast
- `weight` - Weight in model (0-1)
- `trend` - up | down | stable
- `color` - Color for visualization

#### 3. **SCENARIO_3**
Scenario configurations for testing.

**Fields:**
- `orgId` - Organization ID
- `name` - Scenario name
- `description` - Scenario description
- `parameters.cottonPriceIndex` - Cotton price index (0-100)
- `parameters.marketDemandIndex` - Market demand index (0-100)
- `impact.adjustedRevenue` - Adjusted revenue
- `impact.revenueChange` - Change from base
- `impact.adjustedGrowth` - Adjusted growth rate
- `isActive` - Is this scenario active?

#### 4. **ACCURACY_METRIC_3**
Historical accuracy tracking.

**Fields:**
- `orgId` - Organization ID
- `period` - Period of measurement
- `forecastAmount` - Forecasted amount
- `actualAmount` - Actual amount
- `accuracyPercentage` - Accuracy (0-100)
- `variance` - Difference
- `variancePercentage` - Variance percentage

---

## 🔐 Access Control

### Roles

1. **Admin**
   - Full CRUD access to all forecasts
   - Can create/update indicators
   - Can create/test scenarios
   - Can view all data

2. **Analyst**
   - Read-only access to published forecasts
   - Can view indicators and scenarios
   - Can test scenarios
   - Can view accuracy history

3. **Viewer**
   - Read-only access to published forecasts
   - Limited dashboard view

---

## 🔌 Socket.IO Events

### 1. `donear_3/get_all`

Get complete dashboard summary.

**Request:**
```javascript
socket.emit("donear_3/get_all", {}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  totalForecast: {
    amount: 306.4,
    growthRate: 7.7,
    growthVsLastYear: 21.7
  },
  growthRate: {
    value: 7.7,
    industryAvg: 4.3,
    difference: 3.4
  },
  confidence: {
    level: 87,
    benchmarkDifference: 1.8
  },
  trendData: [
    {
      month: "Jan",
      date: "2024-01-01T00:00:00.000Z",
      value: 285.3,
      confidenceInterval: { low: 271.0, high: 299.6 }
    },
    // ... more months
  ],
  indicators: [
    {
      _id: "...",
      name: "Market Demand",
      category: "Market",
      value: 92,
      contribution: 58.7,
      weight: 0.30,
      trend: "up",
      color: "#4ECDC4"
    },
    // ... more indicators
  ],
  activeScenario: {
    _id: "...",
    name: "Base Case",
    parameters: {
      cottonPriceIndex: 50,
      marketDemandIndex: 50
    },
    impact: {
      adjustedRevenue: 306.4,
      revenueChange: 0,
      adjustedGrowth: 7.7
    }
  }
}
```

### 2. `donear_3/get_forecast`

Get single forecast by ID.

**Request:**
```javascript
socket.emit("donear_3/get_forecast", {
  forecastId: "forecast_id_here"
}, (response) => {
  console.log(response);
});
```

### 3. `donear_3/create_update_forecast`

Create or update a forecast (Admin only).

**Request:**
```javascript
socket.emit("donear_3/create_update_forecast", {
  forecastId: "optional_for_update",
  period: "2024-10-01",
  totalAmount: 306.4,
  growthRate: 7.7,
  confidence: 87,
  industryAvgGrowth: 4.3,
  benchmarkConfidence: 85.2,
  previousYearAmount: 284.7,
  status: "published",
  notes: "Q4 forecast"
}, (response) => {
  console.log(response);
});
```

### 4. `donear_3/get_indicators`

Get indicators for a forecast.

**Request:**
```javascript
socket.emit("donear_3/get_indicators", {
  forecastId: "forecast_id_here"
}, (response) => {
  console.log(response);
});
```

### 5. `donear_3/create_update_indicator`

Create or update an indicator (Admin only).

**Request:**
```javascript
socket.emit("donear_3/create_update_indicator", {
  indicatorId: "optional_for_update",
  forecastId: "forecast_id",
  name: "Raw Material Cost",
  category: "Cost",
  value: 85,
  contribution: 45.2,
  weight: 0.25,
  trend: "up",
  color: "#FF6B6B"
}, (response) => {
  console.log(response);
});
```

### 6. `donear_3/get_scenarios`

Get all scenarios.

**Request:**
```javascript
socket.emit("donear_3/get_scenarios", {}, (response) => {
  console.log(response);
});
```

### 7. `donear_3/create_update_scenario`

Create or update a scenario (Admin only).

**Request:**
```javascript
socket.emit("donear_3/create_update_scenario", {
  scenarioId: "optional_for_update",
  name: "Optimistic Growth",
  description: "High demand scenario",
  parameters: {
    cottonPriceIndex: 45,
    marketDemandIndex: 75
  },
  impact: {
    adjustedRevenue: 319.8,
    revenueChange: 13.4,
    adjustedGrowth: 12.4
  },
  isActive: false
}, (response) => {
  console.log(response);
});
```

### 8. `donear_3/test_scenario`

Test scenario with different parameters.

**Request:**
```javascript
socket.emit("donear_3/test_scenario", {
  cottonPriceIndex: 60,
  marketDemandIndex: 40
}, (response) => {
  console.log(response);
  // {
  //   baseForecast: { amount: 306.4, growthRate: 7.7 },
  //   parameters: { cottonPriceIndex: 60, marketDemandIndex: 40 },
  //   impact: {
  //     adjustedRevenue: 298.2,
  //     revenueChange: -8.2,
  //     adjustedGrowth: 4.8
  //   }
  // }
});
```

### 9. `donear_3/get_accuracy_history`

Get historical accuracy metrics.

**Request:**
```javascript
socket.emit("donear_3/get_accuracy_history", {
  limit: 12 // optional, default 12
}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  history: [
    {
      period: "2024-09-01",
      forecastAmount: 294,
      actualAmount: 296.5,
      accuracyPercentage: 99.15,
      variance: 2.5,
      variancePercentage: 0.85
    },
    // ... more months
  ],
  summary: {
    averageAccuracy: 95.8,
    periods: 12,
    latestAccuracy: 99.15
  }
}
```

---

## 🚀 Setup Instructions

### 1. Create Admin User with Sample Data

```bash
npm run create-donear-admin
```

This will create:
- Admin user: `donear-admin@example.com` / `admin123`
- Ticket with all features
- Sample forecast data (7 forecasts)
- 5 leading indicators
- 3 scenarios
- 12 months of accuracy history

### 2. Login

```javascript
// Connect to Socket.IO server
const socket = io("http://localhost:3000", {
  auth: {
    token: "your_jwt_token" // or use cookie
  }
});

// Or login first
socket.emit("login", {
  email: "donear-admin@example.com",
  password: "admin123"
}, (response) => {
  console.log(response.token);
  // Store token for future connections
});
```

### 3. Fetch Dashboard Data

```javascript
socket.emit("donear_3/get_all", {}, (response) => {
  console.log("Dashboard data:", response);
});
```

---

## 📈 Scenario Impact Calculation

The system uses a formula to calculate scenario impacts:

### Cotton Price Impact
- **Base Index**: 50 (normal)
- **Formula**: `((50 - cottonPriceIndex) / 50) * 0.04`
- **Range**: ±4% revenue impact
- **Logic**: Higher cotton prices = lower margins = revenue decrease

### Market Demand Impact
- **Base Index**: 50 (normal)
- **Formula**: `((marketDemandIndex - 50) / 50) * 0.06`
- **Range**: ±6% revenue impact
- **Logic**: Higher demand = higher revenue

### Combined Impact
```javascript
totalImpact = cottonImpact + demandImpact
adjustedRevenue = baseForecast * (1 + totalImpact)
adjustedGrowth = baseGrowth + (totalImpact * 100)
```

**Example:**
- Base Forecast: ₹306.4 Cr
- Cotton Price Index: 60 (higher prices)
- Market Demand Index: 70 (higher demand)

```javascript
cottonImpact = ((50 - 60) / 50) * 0.04 = -0.008 (-0.8%)
demandImpact = ((70 - 50) / 50) * 0.06 = +0.024 (+2.4%)
totalImpact = -0.008 + 0.024 = +0.016 (+1.6%)

adjustedRevenue = 306.4 * 1.016 = ₹311.3 Cr
revenueChange = +₹4.9 Cr
adjustedGrowth = 7.7 + 1.6 = 9.3%
```

---

## 🎨 Frontend Integration Guide

### Dashboard Layout

```javascript
// Main dashboard component
function SalesForecastingDashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    socket.emit("donear_3/get_all", {}, (response) => {
      setDashboardData(response);
    });
  }, []);

  return (
    <div>
      <MetricsCards data={dashboardData} />
      <TrendChart data={dashboardData?.trendData} />
      <IndicatorsChart data={dashboardData?.indicators} />
      <ScenarioTesting activeScenario={dashboardData?.activeScenario} />
    </div>
  );
}
```

### Scenario Testing Component

```javascript
function ScenarioTesting() {
  const [cottonPrice, setCottonPrice] = useState(50);
  const [marketDemand, setMarketDemand] = useState(50);
  const [impact, setImpact] = useState(null);

  const handleTest = () => {
    socket.emit("donear_3/test_scenario", {
      cottonPriceIndex: cottonPrice,
      marketDemandIndex: marketDemand
    }, (response) => {
      setImpact(response.impact);
    });
  };

  return (
    <div>
      <Slider 
        label="Cotton Price Index"
        value={cottonPrice}
        onChange={setCottonPrice}
        min={0}
        max={100}
      />
      <Slider 
        label="Market Demand Index"
        value={marketDemand}
        onChange={setMarketDemand}
        min={0}
        max={100}
      />
      <button onClick={handleTest}>Test Scenario</button>
      {impact && (
        <div>
          <p>Adjusted Revenue: ₹{impact.adjustedRevenue} Cr</p>
          <p>Change: {impact.revenueChange > 0 ? '+' : ''}₹{impact.revenueChange} Cr</p>
          <p>Adjusted Growth: {impact.adjustedGrowth}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Notes

- No MQTT integration (manual data entry only)
- No cron jobs (no automated report generation)
- Redis is still used for Socket.IO adapter and user caching
- All data is entered manually through Socket.IO events
- Follows the same architectural patterns as other systems
- Fully integrated with existing authentication and authorization

---

## 🔍 Troubleshooting

### "Feature not found" in console
- Check that the user's ticket includes the required feature
- Verify ticket is properly assigned to user's `donear_3` field

### "Insufficient permissions" error
- Only admins can create/update forecasts, indicators, and scenarios
- Analysts and viewers have read-only access

### No data returned from `get_all`
- Ensure at least one forecast has status "published"
- Run `npm run create-donear-admin` to populate sample data

---

## 🛠️ Customization

### Adding Custom Factors to Scenarios

Modify the scenario parameters to include custom factors:

```javascript
socket.emit("donear_3/create_update_scenario", {
  name: "Custom Scenario",
  parameters: {
    cottonPriceIndex: 50,
    marketDemandIndex: 50,
    customFactors: {
      "exportTariff": 10,
      "laborCost": 85,
      "energyCost": 70
    }
  },
  // ... rest of data
});
```

Then update `calculateScenarioImpact()` in `utils/calculateForecast.ts` to use these factors.

---

## 📚 Related Documentation

- [Main Architecture Documentation](../../README.md)
- [Authentication Flow](../../auth/README.md)
- [Socket.IO Best Practices](../../docs/socketio.md)




