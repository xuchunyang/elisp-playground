const form = document.querySelector("form");
const output = document.querySelector("#output");
const codeInput = document.querySelector("textarea#code");
const versionSelect = document.querySelector("select#version");

// FIXME use localhost for local dev, use another for production, template?
let API_ENDPOINT = "https://elisp-playground.xuchunyang.me/";
// let API_ENDPOINT = "http://localhost:3000/";

form.onsubmit = async (e) => {
  e.preventDefault();
  const version = versionSelect.value;
  const code = codeInput.value.trim();
  if (code === "") {
    output.innerHTML = `<p>You have not entered any code</p>`;
    return;
  }
  const url = API_ENDPOINT;
  output.innerHTML = "<p>Running your code...</p>";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ version, code }),
    });
    console.log(response);
    const json = await response.json();
    console.log(json);
    history.pushState(
      json,
      "Emacs Lisp Playground",
      `?version=${version}&code=${encodeURIComponent(code)}`
    );
    showResult(json);
    saveState(version, code, JSON.stringify(json));
  } catch (err) {
    output.innerHTML = `<p>ERROR: ${err.message}</p>`;
  }
};

const showResult = (json) => {
  if ("error" in json) {
    output.innerHTML = `<p>${json.error}</p>`;
    return;
  }
  // All elisp expression have value
  output.innerHTML = `<p>Value:</p> <pre>${json.value}</pre>`;
  if (json.stdout !== "") {
    output.innerHTML += `<p>Stdout:</p> <pre>${json.stdout}</pre>`;
  }
  if (json.stderr !== "") {
    output.innerHTML += `<p>Stderr:</p> <pre>${json.stderr}</pre>`;
  }
  output.innerHTML += `<p>Code run time: ${json.cost}</p`;
};

let saveState = () => {};
let loadState = () => {};

if (window.location.search) {
  const urlParams = new URLSearchParams(window.location.search);
  const version = urlParams.get("version");
  if (version) versionSelect.value = version;
  const code = urlParams.get("code");
  if (code) codeInput.value = code;
  // not work
  // form.submit();
  form.querySelector("button").click();
} else if ("localStorage" in window) {
  saveState = (version, code, result) => {
    localStorage.setItem("version", version);
    localStorage.setItem("code", code);
    localStorage.setItem("result", result);
  };
  loadState = () => {
    const version = localStorage.getItem("version");
    if (version) versionSelect.value = version;
    const code = localStorage.getItem("code");
    if (code) codeInput.value = code;
    const result = localStorage.getItem("result");
    if (result) showResult(JSON.parse(result));
  };
  loadState();
} else {
  console.log("localStorage is not supported");
}

codeInput.addEventListener("keydown", function (e) {
  if (e.keyCode == 13 && e.metaKey) {
    this.form.submit();
  }
});
