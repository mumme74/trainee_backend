import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation("core");
  return (
    <div>
      <h1>{t("home_header")}</h1>
      <p>{t("home_description")}</p>
      <p>{t("home_login_first")}</p>
      <Link to="/login">{t("login_here")}</Link>
    </div>
  );
}
