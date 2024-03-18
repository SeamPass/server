const axios = require("axios");

const testApi = async () => {
  const prefix = "67a2c"; // Replace with a valid prefix
  try {
    const response = await axiosInstance.get(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testApi();
