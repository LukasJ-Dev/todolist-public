import React from 'react';
import Navbar from '../UI/Navbar';
import * as S from './style';
import { useDispatch } from 'react-redux';
import { toggleMenu } from '../../features/ui/uiSlice';

interface Props {
  children: string | JSX.Element | JSX.Element[];
}

const StandardLayout: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch();

  return (
    <S.LayoutStyle>
      <Navbar
        title="LJ Todolist App"
        items={[]}
        hasMenuButton
        onMenuClick={() => dispatch(toggleMenu(true))}
      />
      {children}
    </S.LayoutStyle>
  );
};

export default StandardLayout;
