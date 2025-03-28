import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: "localhost",
  user: "sinnlos",
  password: "1234",
  database: "ia_data",
});




/**
 * Normalize symptoms by sorting and converting to lowercase.eliminar vocales y consonantes repetidas (primero las ctes repetidas para no prunear demasiado)
 */
const normalizeSymptoms = (symptoms) => {
  return symptoms.map(s => s.trim().toLowerCase()).sort();
};



/**
 * Retrieve IDs of symptoms based on their names.
 */
export const getSymptomIds = async (symptoms) => {
  const connection = await pool.getConnection();
  try {
    const placeholders = symptoms.map(() => "?").join(", "); // creates a string of placeholders (e.g., "?, ?, ?" for three symptoms).
    const query = " SELECT id, name FROM symptoms WHERE replace(lower(name), ' ', '') IN ("+placeholders+")";
      //se debería poner puntaje del 0 al 3 a sintomas en relacion con diagnostico, y considerar plural errores de tipeo, etc.
    //console.log(query+"\n"+symptoms);
    const result = await connection.query(query, symptoms);
    //console.log("symptoms: "+symptoms+"\nquery: "+query+"\nresul: "+result.length); //result[0].id y result[0].name ... devuelve array of objects
    return result;
  } finally {
    connection.release();
  }
};



/**
 * Insert a diagnosis into the diagnosed table if it doesn't exist.
 * Returns the diagnosis ID.
 */
export const getOrInsertDiagnosis = async (description) => {
	const connection = await pool.getConnection();
  	//console.log("entro a getorinsert_diagnosis: "+description);

  	try {
    	const insertQuery = `
      	INSERT INTO diagnoses (diagnosis)
      	VALUES (?)
    	`;
    const result = await connection.query(insertQuery, description);
    console.log(`Inserted new diagnosis with ID ${result.insertId}, and description: ${description}`);
    return result.insertId;
  } finally {
    connection.release();
  }
};


export const normalize_to_array = (text) => {
  return text
    .toLowerCase() // Convert to lowercase
    .split(",") // Split into words
//    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation and spaces: \s /g=global, no parar a la primera ocurrencia
//    .replace(/\b(the|and|or|of|to|by|a|an|is|are|in|on|for|with|such|as|can|may|be)\b/g, "") // Remove stop words
    .filter(word => word.length > 3) // Keep only meaningful words (length > 3)
    //.join(" "); // Rejoin into a single string
};


/**
 * Insert symptom-diagnosis combinations into the symptom_combinations table.
 */
export const insertSymptomCombination = async (symptomIds, diagnosisId) => {
  const connection = await pool.getConnection();
  try {
    const query = `
      INSERT INTO symptom_combinations (symptom_id, diagnosis_id)
      VALUES (?, ?)
    `;
    for (const symptomId of symptomIds) {
      await connection.query(query, [symptomId, diagnosisId]);
    }
    console.log(`Inserted combinations for diagnosis ID: ${diagnosisId}`);
  } finally {
    connection.release();
  }
};


/**
 * @param {number[]} symptomIds - Array of symptom IDs.
 * @returns {Promise<Object|null>} - Existing diagnosis or null if not found.
 */
export async function findExistingDiagnosis(symptomIds) {
  const placeholders = symptomIds.map(() => "?").join(",");
  const query = `
    SELECT d.*
    FROM diagnoses d
    JOIN symptom_combinations sc ON d.id = sc.diagnosis_id
    WHERE sc.symptom_id IN (${placeholders})
    GROUP BY d.id
    HAVING COUNT(DISTINCT sc.symptom_id) = ?
    LIMIT 1; 
  `; // only one diagnosis meeting the criteria is returned and ?:symptomIds.length

  const conn = await pool.getConnection();
  try {
    const results = await conn.query(query, [...symptomIds, symptomIds.length]);
    return results[0] || null;
  } finally {
    conn.release();
  }
}

