import { buildKnowledge } from "../src/services/knowledgeBuild.mjs";

const sourceDir = process.argv[2];
const result = buildKnowledge(sourceDir ? { sourceDir } : {});

console.log(
  JSON.stringify(
    {
      generatedAt: result.generatedAt,
      documents: result.documents.length,
      spots: result.spots.length,
      guideSections: result.guideSections.length,
      chunks: result.chunks.length
    },
    null,
    2
  )
);
