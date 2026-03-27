// CPF máscara
document.getElementById("cpf").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  e.target.value = v;
});

// RG máscara
document.getElementById("rg").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "").slice(0, 9);
  v = v.replace(/(\d{2})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1})$/, "$1-$2");
  e.target.value = v;
});

// Valor máscara
document.getElementById("valor").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "");
  v = (v / 100).toFixed(2);
  v = v.replace(".", ",");
  v = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  e.target.value = "R$ " + v;
});

// CPF real
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += cpf[i] * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto != cpf[9]) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += cpf[i] * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto != cpf[10]) return false;

  return true;
}

// Valor por extenso (simplificado)
function numeroParaExtenso(valor) {
  valor = valor.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
  let num = parseFloat(valor);

  if (isNaN(num)) return "";

  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];

  let inteiro = Math.floor(num);
  let centavos = Math.round((num - inteiro) * 100);

  let texto = "";

  if (inteiro < 10) texto = unidades[inteiro];
  else if (inteiro < 20) texto = especiais[inteiro - 10];
  else {
    texto = dezenas[Math.floor(inteiro / 10)];
    if (inteiro % 10 !== 0) texto += " e " + unidades[inteiro % 10];
  }

  texto += " reais";

  if (centavos > 0) {
    texto += " e ";
    if (centavos < 10) texto += unidades[centavos];
    else if (centavos < 20) texto += especiais[centavos - 10];
    else {
      texto += dezenas[Math.floor(centavos / 10)];
      if (centavos % 10 !== 0) texto += " e " + unidades[centavos % 10];
    }
    texto += " centavos";
  }

  return texto;
}

// Data formato jurídico
function formatarDataExtenso(data) {
  const meses = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
  ];
  const [ano, mes, dia] = data.split("-");
  return `${dia} de ${meses[mes - 1]} de ${ano}`;
}

// formatar data de periodo
function formatarDataBR(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Gerar DOCX
function gerarDoc() {
  const cpf = document.getElementById("cpf").value;

  if (!validarCPF(cpf)) {
    alert("CPF inválido");
    return;
  }

  fetch("./modelo.docx") // 👈 garante caminho correto
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao carregar modelo.docx");
      return res.arrayBuffer();
    })
    .then((content) => {
      const zip = new PizZip(content);
      const doc = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const valor = document.getElementById("valor").value;
      const valorExtenso = numeroParaExtenso(valor);

      const dataBruta = document.querySelector('[name="data"]').value;
      const dataFormatada = formatarDataExtenso(dataBruta);

      doc.setData({
        nome: document.querySelector('[name="nome"]').value,
        cpf: cpf,
        rg: document.getElementById("rg").value,
        nacionalidade: "Brasileiro",
        estado_civil: document.querySelector('[name="estado_civil"]').value,
        endereco: document.querySelector('[name="endereco"]').value,
        numero: document.querySelector('[name="numero"]').value,
        bairro: document.querySelector('[name="bairro"]').value,
        cidade: document.querySelector('[name="cidade"]').value,
        uf: "RJ",

        valor: `${valor} (${valorExtenso})`,
        inicio: formatarDataBR(document.querySelector('[name="inicio"]').value),
        fim: formatarDataBR(document.querySelector('[name="fim"]').value),
        data: dataFormatada,
      });

      try {
        doc.render();
      } catch (error) {
        console.error(error);
        alert("Erro ao gerar documento. Verifique os campos.");
        return;
      }

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Contrato.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((erro) => {
      console.error(erro);
      alert("Erro ao carregar o modelo.docx");
    });
}
