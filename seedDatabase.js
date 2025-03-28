const { insertSymptom } = require("./database");
const { vectorizeText } = require("./utils/vectorizer");

const seedData = async () => {
  const symptoms = [
    { name: "Fever", description: "High body temperature, often caused by infection." },
    { name: "Cough", description: "Commonly associated with colds, flu, or respiratory infections." },
    { name: "Fatigue", description: "Extreme tiredness, often linked to lack of sleep or illness." },
    { name: "Headache", description: "Pain in the head, often due to stress or tension." },
  ];

  for (const symptom of symptoms) {
    const embedding = await vectorizeText(symptom.description);
    await insertSymptom(symptom.name, symptom.description, embedding);
  }

  console.log("Database seeded.");
};

seedData();
