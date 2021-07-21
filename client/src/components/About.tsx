import React from "react";
import { useTranslation } from "react-i18next";

import Logo from "./header/Logo";

const About: React.FC<JSX.ElementAttributesProperty> = (props) => {
  const { t } = useTranslation("core");

  return (
    <div className="container">
      <h2>
        {t("about_header_pre") + " "}
        <Logo className="m-1" />
        {t("about_header_post") + " "}
      </h2>
      <p>{t("about_desc1")}</p>
      <p>{t("about_desc2")}</p>
      <h3>{t("about_lic_header")}</h3>
      <p>{t("about_lic_desc1")}</p>
      <p>{t("about_lic_desc2")}</p>
      <p className="h5">
        Copyright (c) 2021 Fredrik Johansson github.com/mumme74
      </p>
      <p>
        Permission is hereby granted, free of charge, to any person obtaining a
        copy of this software and associated documentation files (the
        "Software"), to deal in the Software without restriction, including
        without limitation the rights to use, copy, modify, merge, publish,
        distribute, sublicense, and/or sell copies of the Software, and to
        permit persons to whom the Software is furnished to do so, subject to
        the following conditions:
      </p>
      <p>
        The above copyright notice and this permission notice shall be included
        in all copies or substantial portions of the Software.
      </p>
      <p>
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
        IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
        CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
        TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
        SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      </p>
    </div>
  );
};

export default About;
