import streamlit as st
import sys
import os

# Add the parent directory to the path to access modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import required authentication utilities
from auth.auth_utils import (
    check_user_access,  # New unified auth check
    can_edit,           # For edit-only features 
    is_admin,           # For admin-only features
    has_ai_features,    # For features requiring premium IA plan
    get_user_display_name  # For showing user info or logging
)
from config.page_config import set_page_config

# Apply consistent page configuration
set_page_config()

def show_page():
    st.title("Page Title")
    
    # Check permissions - minimal needed to view the page
    if not check_user_access("viewer"):  # Can use "viewer", "editor", or "admin"
        st.warning("Você não tem permissão para acessar esta página.")
        return
    
    # Continue with page content
    st.write("Content accessible to users with 'viewer' role or higher")
    
    # For sections requiring edit permissions
    if can_edit():
        st.subheader("Edit Features")
        st.write("Content accessible to users with 'editor' role or higher")
    else:
        st.info("Você precisa de permissões de edição para utilizar algumas funcionalidades.")
    
    # For admin-only features
    if is_admin():
        st.subheader("Admin Features")
        st.write("Content accessible only to users with 'admin' role")
    
    # For features requiring premium_ia plan
    if has_ai_features():
        st.subheader("AI Features")
        st.write("Content accessible to users with 'premium_ia' plan")
    else:
        # Optional: Show upgrade callout
        st.info("✨ Este recurso está disponível no plano Premium IA. Faça o upgrade para usar IA!")
