import { Navbar, Container, Nav, Button, NavItem, NavLink } from 'react-bootstrap';

export default function Home() {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Nav>
          <NavItem>
            <NavLink href="/">Home</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/owned">Owned</NavLink>
          </NavItem>
        </Nav>
      </Container>
      <Container className="justify-content-end">
        <Button>Create</Button>
        <Button>Mint AUC</Button>
        <Button>Connect MetaMask</Button>
      </Container>
    </Navbar>
  )
}
