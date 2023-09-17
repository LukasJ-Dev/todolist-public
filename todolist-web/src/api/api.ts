import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 2000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

export default axiosClient;
