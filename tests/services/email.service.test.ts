jest.mock("nodemailer");

import nodemailer from "nodemailer";
import { sendEmail } from "../../src/services/email.service";


let sendMailMock: jest.Mock<void, [], any>;
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockImplementation((()=>{
    const o = {
      sendMail: jest.fn(()=>{
        //console.log('sendMail.called')
      }),
    }
    sendMailMock = o.sendMail;
    return o;
  })),
}));

beforeEach(()=>{
  if (sendMailMock)
    sendMailMock?.mockClear();
  (nodemailer.createTransport as any).mockClear();
})

describe('Test send mail', ()=>{
  const mailer = {
    to: "sot@dot.com",
    subject: "subject",
    from:'tester@test.nu'
  },
    template = 'password.request.reset.pug',
    payload = {name:'testName', link:'href://link.se'};

  it("Should send mail", async ()=>{
    const res = await sendEmail(
      mailer.to,
      mailer.subject,
      payload,
      template,
      mailer.from
    );

    const call = sendMailMock.mock.lastCall?.at(0);

    expect(res).toBe(true);
    expect(sendMailMock).toHaveBeenCalled();
    expect(call).toMatchObject(mailer);
    expect((call as any)?.html)
      .toMatch(
        new RegExp(
          `${payload.name}!.*<a href="${payload.link}"`,'ig'));
  })

})