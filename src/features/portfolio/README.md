# Project Portfolio module

Named export:

```js
import { PortfolioModule } from './features/portfolio/PortfolioModule.jsx';
```

Props: `projects`, `user`, `onSelectProject`.

Row selection opens a local preview drawer. The “Ouvrir” action calls `onSelectProject(projectId)`. All data are simulated demonstration data.

The portfolio receives only the projects in the persona’s scope (`access.filterProjects`).
