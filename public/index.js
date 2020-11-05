const form = document.querySelector("form");
const output = document.querySelector("#output");
const input = document.querySelector("textarea#code");

const API_ENDPOINT = "https://elisp-playground.xuchunyang.me/";

form.onsubmit = async (e) => {
  e.preventDefault();
  const code = input.value.trim();
  if (code === "") {
    output.innerHTML = `<p>You have not entered any code</p>`;
    return;
  }
  const url = API_ENDPOINT;
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
  output.innerHTML = `<pre>${JSON.stringify(json, null, 2)}</pre>`;
};
