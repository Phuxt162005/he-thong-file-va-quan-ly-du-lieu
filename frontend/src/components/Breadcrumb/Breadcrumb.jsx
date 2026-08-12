import { Link } from "react-router-dom";

import "./Breadcrumb.css";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb">
      <Link to="/files" className="breadcrumb__item">
        Tệp của tôi
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={`${item.id || item.name}-${index}`}
            className="breadcrumb__segment"
          >
            <span className="breadcrumb__separator">/</span>

            {isLast ? (
              <span className="breadcrumb__current">{item.name}</span>
            ) : (
              <Link
                to={item.path || `/files/${item.id}`}
                className="breadcrumb__item"
              >
                {item.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
