const login_button = document.querySelector("#login-button")
const registration_button = document.querySelector("#registration-button")

login_button.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/login";
})

registration_button.addEventListener("click", () => {
    window.location.href = "http://localhost:3000/register";
})