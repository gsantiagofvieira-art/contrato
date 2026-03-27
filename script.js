// Máscara CPF: 000.000.000-00
document.getElementById("cpf").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "");

  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  e.target.value = v;
});

// Máscara RG (formato genérico): 00.000.000-0
document.getElementById("rg").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "");

  v = v.replace(/(\d{2})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1})$/, "$1-$2");

  e.target.value = v;
});

document.getElementById("valor").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "");

  v = (v / 100).toFixed(2) + "";
  v = v.replace(".", ",");
  v = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  e.target.value = "R$ " + v;

  if (v === "0,00") {
    e.target.value = "";
  } else {
    e.target.value = "R$ " + v;
  }
});

document
  .getElementById("formCadastro")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.querySelector('[name="nome"]').value.trim();
    const cpf = document.getElementById("cpf").value;
    const rg = document.getElementById("rg").value;
    const valor = document.getElementById("valor").value;

    // 🔴 Validação nome
    if (nome.length < 3) {
      alert("Nome deve ter pelo menos 3 caracteres.");
      return;
    }

    // 🔴 Validação CPF (formato básico)
    if (cpf.length < 14) {
      alert("CPF incompleto.");
      return;
    }

    // 🔴 Validação RG
    if (rg.length < 12 && rg.length > 0) {
      alert("RG incompleto.");
      return;
    }

    // 🔴 Validação valor
    if (!valor || valor === "R$ 0,00") {
      alert("Informe um valor válido.");
      return;
    }

    // 🔴 Validação datas
    const datas = document.querySelectorAll('input[type="date"]');
    for (let data of datas) {
      if (!data.value) {
        alert("Preencha todas as datas.");
        return;
      }
    }

    // 🟢 Se tudo estiver ok
    alert("Formulário enviado com sucesso!");
  });

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;

  // ❌ Elimina CPFs inválidos conhecidos (todos números iguais)
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  let resto;

  // 🔢 Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;

  // 🔢 Segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

function gerarDoc() {
  fetch("modelo.docx")
    .then((res) => res.arrayBuffer())
    .then((content) => {
      const zip = new PizZip(content);
      const doc = new window.docxtemplater(zip);

      const valorFormatado = document.getElementById("valor").value;
      const valorExtenso = numeroParaExtenso(valorFormatado);
      const dataBruta =
        document.querySelectorAll('input[type="date"]')[2].value;
      const dataFormatada = formatarDataExtenso(dataBruta);

      doc.setData({
        nome: document.querySelector('[name="nome"]').value,
        cpf: document.getElementById("cpf").value,
        rg: document.getElementById("rg").value,
        nacionalidade: "Brasileiro",
        estado_civil: document.querySelector("select").value,
        endereco: document.querySelector('[name="endereco"]').value,
        numero: document.querySelector('[name="numero"]').value,
        bairro: document.querySelector('[name="bairro"]').value,
        cidade: document.querySelector('[name="cidade"]').value,
        uf: "RJ",

        valor: `${valorFormatado} (${valorExtenso})`,
        inicio: document.querySelector('[name="inicio"]').value,
        fim: document.querySelector('[name="fim"]').value,
        data: dataFormatada,
      });

      doc.render();

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(blob, "Contrato.docx");
    });
}

function numeroParaExtenso(valor) {
  const unidades = [
    "",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
  ];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta"];
  const especiais = [
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
  ];

  valor = valor.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
  let numero = parseFloat(valor);

  let inteiro = Math.floor(numero);
  let centavos = Math.round((numero - inteiro) * 100);

  let texto = "";

  if (inteiro < 10) {
    texto += unidades[inteiro];
  } else if (inteiro < 20) {
    texto += especiais[inteiro - 10];
  } else if (inteiro < 100) {
    texto += dezenas[Math.floor(inteiro / 10)];
    if (inteiro % 10 !== 0) {
      texto += " e " + unidades[inteiro % 10];
    }
  }

  texto += " reais";

  if (centavos > 0) {
    texto += " e ";
    if (centavos < 10) {
      texto += unidades[centavos];
    } else if (centavos < 20) {
      texto += especiais[centavos - 10];
    } else {
      texto += dezenas[Math.floor(centavos / 10)];
      if (centavos % 10 !== 0) {
        texto += " e " + unidades[centavos % 10];
      }
    }
    texto += " centavos";
  }

  return texto;
}

function formatarDataExtenso(data) {
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const [ano, mes, dia] = data.split("-");

  return `${dia} de ${meses[parseInt(mes) - 1]} de ${ano}`;
}
