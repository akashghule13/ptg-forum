exports.getTime = function (){
    const today = new Date();
   
    const options1 = {
        day: "numeric",
        month: "long",
        year: "numeric"
    };
    const options2 = {
        timeZone: "IST",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    };
    const day = today.toLocaleDateString("en-IN",options1);
    const time = today.toLocaleTimeString("en-IN",options2);
    return day+", "+time;
}