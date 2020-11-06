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
  if ("error" in json) {
    output.innerHTML = `<pre>${JSON.stringify(json, null, 2)}</pre>`;
    return;
  }
  output.innerHTML = `
<p>Value:</p>
<pre>${json.value}</pre>

<p>Stdout:</p>
<pre>${json.stdout}</pre>

<p>Stderr:</p>
<pre>${json.stderr}</pre>
`;
};
