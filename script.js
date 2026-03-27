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
  return parseFloat(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
        inicio: document.querySelector('[name="inicio"]').value,
        fim: document.querySelector('[name="fim"]').value,
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

      saveAs(blob, "Contrato.docx"); // 👈 DOWNLOAD AQUI
    })
    .catch((erro) => {
      console.error(erro);
      alert("Erro ao carregar o modelo.docx");
    });
}
