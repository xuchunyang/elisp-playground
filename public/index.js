const form = document.querySelector("form");
const output = document.querySelector("#output");
const input = document.querySelector("textarea#code");

const API_ENDPOINT = "https://elisp-playground.xuchunyang.me/";
// const API_ENDPOINT = "http://pc.lan:3000/";

form.onsubmit = async (e) => {
  e.preventDefault();
  const code = input.value.trim();
  if (code === "") {
    output.innerHTML = `<p>You have not entered any code</p>`;
    return;
  }
  const url = API_ENDPOINT;
  output.innerHTML = "<p>Running your code...</p>";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ code }),
  });
  console.log(response);
  const json = await response.json();
  console.log(json);
  showResult(json);
  saveState(code, JSON.stringify(json));
};

const showResult = (json) => {
  if ("error" in json) {
    output.textContent = json.error;
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
};

let saveState = () => {};
let loadState = () => {};

if ("localStorage" in window) {
  saveState = (code, result) => {
    localStorage.setItem("code", code);
    localStorage.setItem("result", result);
  };
  loadState = () => {
    const code = localStorage.getItem("code");
    if (code) input.value = code;
    const result = localStorage.getItem("result");
    if (result) showResult(JSON.parse(result));
  };
  loadState();
} else {
  console.log("localStorage is not supported");
}
