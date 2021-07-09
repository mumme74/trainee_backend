import app from "./app";

// start server
const port = parseInt(process.env.PORT+"");
const host = process.env.HOST+"";
app.listen(port, host, () => {
    console.log("Server listening at " + port);
});
app.on('error', (err)=> {
    console.error(err);
})
