const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const hbs = require('hbs');
const app = express();

app.set('view engine', 'hbs');
app.set("hbs" , hbs.engine)
app.set("views", "views");
app.use("/static", express.static("public"));

const password = process.env.PASSWORD_POSTGRES;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: password,
    port: 5432,
});

app.get('/urlfetch', (req, res) => {
    fetch('https://api.wazirx.com/api/v2/tickers')
        .then(response => response.json())
        .then(data => {
            // const dataArray = Array.isArray(data) ? data : [data];
            
            const values = Object.keys(data).map(key => {
                const coinData = data[key];
                const recordValues = [
                    key, 
                    coinData.base_unit,
                    coinData.quote_unit,
                    coinData.low,
                    coinData.high,
                    coinData.last,
                    coinData.type,
                    coinData.open,
                    coinData.volume,
                    coinData.sell,
                    coinData.buy,
                    coinData.at, 
                    coinData.name,
                ];
    
                // console.log(`Record Values for ${key}:`, recordValues); // Log values for debugging
    
                return recordValues;
            });
    
            // Constructing the placeholders for each set of values
            const placeholders = values.map((_, index) => `($${index * 13 + 1}, $${index * 13 + 2}, $${index * 13 + 3}, $${index * 13 + 4}, $${index * 13 + 5}, $${index * 13 + 6}, $${index * 13 + 7}, $${index * 13 + 8}, $${index * 13 + 9}, $${index * 13 + 10}, $${index * 13 + 11}, $${index * 13 + 12}, $${index * 13 + 13})`).join(', ');
    
            const query = {
                text: `
                    INSERT INTO stocks (key_column, base_unit, quote_unit, low, high, last, type, open, volume, sell, buy, at, name)
                    VALUES ${placeholders}
                `,
                values: values.flat(),
            };

            pool.query(query)
                .then(result => {
                    console.log(`Data inserted successfully`);
                })
                .catch(error => {
                    console.error('Error inserting data into PostgreSQL', error);
                })
                .finally(() => {
                    // Close the PostgreSQL pool
                    pool.end();
                });
        })

})

app.get('/', (req, res) => {
    pool.query('SELECT * FROM stocks order by id  LIMIT 10', (error, result) => {
        if (error) {
            console.error('Error executing query', error);
            res.status(500).send('Error fetching data from PostgreSQL');
            return;
        }

        const first10Entries = result.rows;

        res.render('page', { first10Entries });
    });
});

app.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
});
