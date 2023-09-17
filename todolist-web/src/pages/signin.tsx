import styled from "styled-components";
import Input from "../components/UI/Input";
import StandardLayout from "../components/StandardLayout";
import { Center } from "../components/UI/styles";
import { colors } from "../styles/colors";
import Button from "../components/UI/Button";
import { useState, useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectIsLoggedIn } from "../features/auth/authSelector";
import { AppDispatch } from "../app/store";
import { LogIn } from "../features/auth/authAPI";

const SignupCard = styled.form`
  display: flex;
  flex-direction: column;
  width: 250px;
  gap: 12px;

  padding-bottom: 15vh;
`;

const SignIn = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const [error, setError] = useState({
    general: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };
    const email = target.email.value;
    const password = target.password.value;

    dispatch(LogIn({ email, password }));
  };

  return (
    <StandardLayout>
      <Center>
        <SignupCard onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            id="email"
            name="email"
            error={error.email}
          />
          <Input
            label="Password"
            type="password"
            id="password"
            name="password"
            error={error.password}
          />
          <Button type="submit">Sign In</Button>
          <Link to="/signup">
            <Button color={colors.blue["300"]}>Go to Sign Up</Button>
          </Link>
        </SignupCard>
      </Center>
    </StandardLayout>
  );
};

export default SignIn;
