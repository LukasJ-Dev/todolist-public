import { useSelector } from 'react-redux';
import styled from 'styled-components';
import StandardLayout from '../components/StandardLayout';
import { Container } from '../components/UI/styles';
import { selectSelectedItem, selectShowMenu } from '../features/ui/uiSelector';
import TodolistHandler from '../features/todolist/components/TodolistHandler';
import { SidebarProvider } from '../components/UI/sidebar';
import TodolistView from '../components/TodolistView';

const DashboardLayout = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const SidebarStyle = styled.div<{ showMenu: boolean }>`
  @media screen and (max-width: 768px) {
    ${(props) => props.showMenu && 'display: none;'}
    position: fixed;
    z-index: 10;
    height: 100%;
    padding-right: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

export default function Dashboard() {
  const showMenu = useSelector(selectShowMenu);

  const selectedItem = useSelector(selectSelectedItem);

  return (
    <StandardLayout>
      <SidebarProvider>
        <DashboardLayout>
          <SidebarStyle showMenu={showMenu}>
            <TodolistHandler />
          </SidebarStyle>
          <Container>
            {selectedItem === '' ? (
              <>Dashboard</>
            ) : (
              <TodolistView todolistId={selectedItem} />
            )}
          </Container>
        </DashboardLayout>
      </SidebarProvider>
    </StandardLayout>
  );
}
