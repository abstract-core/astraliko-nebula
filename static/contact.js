function contactGuards(values) {
  const mailBtns = document.getElementsByClassName("contact-mail");
  const phoneBtns = document.getElementsByClassName("contact-phone");

  [...mailBtns, ...phoneBtns].forEach((btn) => {
    btn &&
      btn.addEventListener("click", (ev) => {
        if ((btn.href = "#")) {
          ev.preventDefault();
          if (btn.className.includes("contact-mail")) {
            const value = values["mail"];
            btn.textContent = value;
            btn.href = `mailto:${value}`;
          } else if (btn.className.includes("contact-phone")) {
            const value = values["phone"];
            btn.textContent = value;
            btn.href = `tel:${value}`;
          }
        }
      });
  });
}

contactGuards({ mail: "romaric.ruga@mailo.fr", phone: '0638248507' })
