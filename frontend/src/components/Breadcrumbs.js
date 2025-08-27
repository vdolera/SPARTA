import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(x => x);

  return (
    <nav aria-label="breadcrumb" style={{ margin: "16px 0" }}>
      <ol style={{ display: "flex", listStyle: "none", padding: 0 }}>
        <li>
          <Link to="/">Home</Link>
        </li>
        {pathnames.map((name, idx) => {
          const routeTo = "/" + pathnames.slice(0, idx + 1).join("/");
          const isLast = idx === pathnames.length - 1;
          return (
            <li key={routeTo} style={{ marginLeft: "8px" }}>
              <span style={{ margin: "0 8px" }}>/</span>
              {isLast ? (
                <span style={{ fontWeight: "bold" }}>{decodeURIComponent(name)}</span>
              ) : (
                <Link to={routeTo}>{decodeURIComponent(name)}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;