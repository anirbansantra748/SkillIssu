document.addEventListener('DOMContentLoaded', () => {
    const templatesDiv = document.getElementById('templates');
    const templates = JSON.parse(templatesDiv.getAttribute('data-templates'));

    const languageSelect = document.getElementById('language');
    const codeEditor = document.getElementById('code-editor');

    function updateCodeEditor(language) {
      if (templates && templates[language]) {
        codeEditor.value = templates[language];
      } else {
        codeEditor.value = ''; // Fallback if no template is found
      }
    }

    // Update editor on language change
    languageSelect.addEventListener('change', () => {
      updateCodeEditor(languageSelect.value);
    });

    // Set default template
    updateCodeEditor('python3');
  });

  document.getElementById('like-button').addEventListener('click', async () => {
    const problemId = "<%= problem._id %>";
    const button = document.getElementById('like-button');

    try {
      const response = await fetch(`/problems/${problemId}/like`, { method: 'POST' });
      const data = await response.json();

      if (data.liked) {
        button.classList.remove("btn-outline-info");
        button.classList.add("btn-info");
      } else {
        button.classList.remove("btn-info");
        button.classList.add("btn-outline-info");
      }
    } catch (error) {
      console.error('Error liking the problem:', error);
    }
  });
