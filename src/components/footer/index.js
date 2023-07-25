import style from "./style.css"
import packageJson from "../../../package.json"

const Footer = () => (
  <div class={style.footer}>
    <p class="smaller dimmed mb-05">
      2021 - {new Date().getFullYear()} |{" "}
      <a href="https://github.com/LucaswithC" target="_blank">
        © Lucas
      </a>
    </p>
    <p class={"m-0 smaller dimmed"}>BETA {packageJson.version}</p>
  </div>
);

export default Footer;