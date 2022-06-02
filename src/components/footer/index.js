import style from "./style.css"

const Footer = () => (
  <div class={style.footer}>
    <p class="smaller dimmed mb-05">
      2021 - {new Date().getFullYear()} |{" "}
      <a href="https://github.com/LucaswithC" target="_blank">
        © Lucas Kiers
      </a>
    </p>
    <p class={"m-0 smaller dimmed"}>BETA 0.1.0</p>
  </div>
);

export default Footer;