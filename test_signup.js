async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/user/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Vikas",
                age: 22,
                address: "Diviyapur",
                email: "test@gmail.com",
                aadharCardNumber: "746430819302",
                password: "123456",
                role: "voter"
            })
        });
        const data = await res.json();
        console.log("STATUS:", res.status);
        console.log("DATA:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("ERROR:", err);
    }
}
test();
