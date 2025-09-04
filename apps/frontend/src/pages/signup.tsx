import styled from "styled-components";
import Input from "../components/UI/Input";
import StandardLayout from "../components/StandardLayout";
import { Center } from "../components/UI/styles";
import { colors } from "../styles/colors";
import Button from "../components/UI/Button";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RegisterAccount } from "../features/auth/authAPI";
import { AppDispatch } from "../app/store";
import { selectIsLoggedIn } from "../features/auth/authSelector";
import { useEffect } from "react";

const SignupCard = styled.form`
  display: flex;
  flex-direction: column;
  width: 250px;
  gap: 12px;

  padding-bottom: 20vh;
`;

const SignUp = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      name: { value: string };
      email: { value: string };
      password: { value: string };
      passwordAgain: { value: string };
    };
    const name = target.name.value;
    const email = target.email.value;
    const password = target.password.value;

    dispatch(RegisterAccount({ name, email, password }));
  };

  return (
    <StandardLayout>
      <Center>
        <SignupCard onSubmit={handleSubmit}>
          <Input label="Name" type="name" id="name" name="name" />
          <Input label="Email" type="email" id="email" name="email" />
          <Input
            label="Password"
            type="password"
            id="password"
            name="password"
          />
          <Input
            label="Password Again"
            type="password"
            id="passwordAgain"
            name="passwordAgain"
          />
          <Button type="submit">Sign Up</Button>
          <Link to="/signin">
            <Button color={colors.blue["300"]}>Go to Sign In</Button>
          </Link>
        </SignupCard>
      </Center>
    </StandardLayout>
  );
};

export default SignUp;
