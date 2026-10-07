const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function checkJavaScript(filePath) {
  const result = spawnSync(process.execPath, ["--check", filePath], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    fail(`Falha de sintaxe em ${path.relative(root, filePath)}\n${result.stderr}`);
  }
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`JSON invalido em ${relativePath}: ${error.message}`);
    return null;
  }
}

function checkInlineScripts() {
  const html = fs.readFileSync(path.join(root, "tests.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .join("\n");

  try {
    new Function(scripts);
  } catch (error) {
    fail(`Falha de sintaxe nos testes inline: ${error.message}`);
  }
}

function checkDataReferences() {
  const proposals = readJson("data/propostas.json") || [];
  const comparisons = readJson("data/comparacoes.json") || [];
  const proposalIds = new Set(proposals.map((proposal) => proposal.id));
  const missingIds = new Set();

  comparisons.forEach((comparison) => {
    (comparison.proposalIds || []).forEach((proposalId) => {
      if (!proposalIds.has(proposalId)) {
        missingIds.add(proposalId);
      }
    });
  });

  if (missingIds.size) {
    fail(`Comparacoes apontam para propostas inexistentes: ${[...missingIds].join(", ")}`);
  }
}

function checkEmbeddedData() {
  const embedded = fs.readFileSync(path.join(root, "data", "dados.js"), "utf8");
  if (!embedded.startsWith("window.APP_DATA = ")) {
    fail("data/dados.js nao exporta window.APP_DATA como esperado.");
  }
}

checkJavaScript(path.join(root, "script.js"));
checkJavaScript(path.join(root, "data", "dados.js"));
checkInlineScripts();
readJson("data/candidatos.json");
readJson("data/categorias.json");
readJson("data/propostas.json");
readJson("data/comparacoes.json");
checkDataReferences();
checkEmbeddedData();

if (!process.exitCode) {
  console.log("Validacao concluida com sucesso.");
}

