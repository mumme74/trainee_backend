import React from "react";
import Logo from "./header/Logo";

const About: React.FC<JSX.ElementAttributesProperty> = (props) => {
  return (
    <div className="container">
      <h2>
        About this
        <Logo className="m-1" /> app!
      </h2>
      <p>
        This app was originaly developed by Fredrik Johansson, Växjö Kommun
        Kungsmadskolan, Sweden as a possible answer about how to work with
        digital education, from another perspective than just online text and
        online courseware.
      </p>
      <p>
        This tool works best close coupled with Google classroom. It is inteded
        to add functionality, such as a reading test, glossary/word training via
        plugins.
      </p>
      <h3>License</h3>
      <p>
        All the code for this app is released as open source and can be found on
        github.com/mumme74/trainee
      </p>
      <p>
        Licence for the sorce code of the backend (server) and the frontend
        (browser) code is Licenced under MIT permissive Licence.
      </p>
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
