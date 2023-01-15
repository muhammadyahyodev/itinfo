
router.get("/", (req, res) => {
    res.render(createViewPath("index"), { title: "Home", page_name: "home" });
  });
  
  router.get("/", (req, res) => {
    res.render(createViewPath("index"), { title: "Asosiy", page_name: "home" });
  });