const natural = require("natural");
const WordNet = natural.WordNet;
const wordnet = new WordNet();

async function enhanceLabels(labels = []) {
  const queries = [];

  for (const label of labels) {
    const key = label.toLowerCase();

    const basics = [
      `${key} shop`,
      `${key} store`,
      `${key} service`,
      `${key} repair`
    ];
    queries.push(...basics);

    const syns = await getSynonyms(key);
    syns.forEach(syn => {
      queries.push(`${syn} shop`, `${syn} store`, `${syn} service`, `${syn} repair`);
    });
  }

  return [...new Set(queries)];
}

function getSynonyms(word) {
  return new Promise(resolve => {
    wordnet.lookup(word, results => {
      if (!results || results.length === 0) return resolve([]);

      const syns = [];
      results.forEach(result => {
        result.synonyms.forEach(s => {
          if (s.toLowerCase() !== word.toLowerCase()) {
            syns.push(s.toLowerCase());
          }
        });
      });

      resolve([...new Set(syns)]);
    });
  });
}

module.exports = { enhanceLabels };
