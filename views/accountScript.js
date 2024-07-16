let welcome_text = document.querySelector("#welcome-text");
let diary = document.querySelector("#diary");
const logout_button = document.querySelector("#logout-button");
const save_button = document.querySelector("#save-button");

const message = diary.getAttribute("data-message");


save_button.addEventListener("click", () => {
  const url = "http://localhost:3000/newData";
  const myString = diary.value;
  console.log(myString);

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: myString }), // Konwertujemy dane do formatu JSON
  };

  fetch(url, requestOptions).then((response) => {});
});

logout_button.addEventListener("click", () => {
    window.location.href = 'http://localhost:3000/logout'
})
