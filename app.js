const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ejs = require('ejs');

const app = express();
const port = 3005;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const breeds = JSON.parse(fs.readFileSync('races.json', 'utf-8'));
const prices = JSON.parse(fs.readFileSync('tarifs.json', 'utf-8'));

const animalTypes = ["Chat", "Chien"]

const sizeMapping = {
    "Petit": "small",
    "Moyen": "medium",
    "Grand": "large",
    "Très grand": "really_large",
};

function calculate(animal, size, age) {
    let ageString;

    if (age < 2) ageString = "under_2";
    else if (age < 4) ageString = "between_2_4";
    else if (age < 6) ageString = "between_4_6";
    else ageString = "over_6";

    if (size in sizeMapping) size = sizeMapping[size];

    const insuranceCosts = {};

    if (animal === "Chat") size = "cat";

    Object.keys(prices.formules).forEach(type => {
        if (prices.formules[type][ageString] && prices.formules[type][ageString][size]) {
            insuranceCosts[type] = prices.formules[type][ageString][size];
        } else if (type === "vitale") {
            insuranceCosts[type] = prices.formules[type]["global"]
        } else {
            insuranceCosts[type] = `Invalid insurance type, size, or age category for ${type} insurance.`;
        }
    });

    return insuranceCosts;
}

app.get('/', (req, res) => {
    res.render('index', {breeds, animalTypes, result: null });
});


app.post('/calculate-insurance', (req, res) => {
    const {animal, breed, size, age} = req.body;

    if (animal !== "Chat") {
        if (!breed || !size || !age) {
            return res.status(400).json({ error: "La race, la taille, et l'age sont des paramètres requis." });
        }

        if (!breeds[breed]) {
            return res.status(400).json({ error: "Race de chien non valide." });
        }

        if (!breeds[breed].includes(size)) {
            return res.status(400).json({ error: "Taille de chien non valide pour la race séléctionnée." });
        }
    }

    const insuranceResult = calculate(animal, size, parseInt(age, 10));
    res.render('index', { breeds, animalTypes, result: insuranceResult });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});