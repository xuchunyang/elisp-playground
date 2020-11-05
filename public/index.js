const form = document.querySelector("form");
const output = document.querySelector("p#output");
const input = document.querySelector("textarea#code");

form.onsubmit = async (e) => {
  e.preventDefault();
  const code = input.value.trim();
  if (code === "") {
    output.textContent = "You have not entered any code";
    return;
  }
  const url = "http://127.0.0.1:3000/";
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
  output.textContent = JSON.stringify(json, null, 2);
};
