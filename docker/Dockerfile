FROM debian:11.4-slim


RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat wget unzip net-tools sudo psmisc procps  \
    build-essential git \
    python3 python3-pip python3-setuptools \
    ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavdevice-dev libx11-dev libxext-dev libspandsp-dev libasound2-dev libsdl2-dev \
    && apt-get install -y --install-recommends apache2 \
    && git clone https://github.com/Renater/JitsiMeetUIHelper.git /var/UIHelper \
    && cd /var/UIHelper && git checkout 45c98af02c369a0c1ad3649506236efef74ac0f3 \
    && apt-get remove --purge -y \
    && apt autoremove -y \
    && apt autoclean -y
    
RUN pip3 install gTTS pydub \
    && python3 /var/UIHelper/scripts/generate_tts_files.py -i /var/UIHelper/src/assets/lang/ -o /var/UIHelper/src/assets/lang/files/ \
    && pip3 uninstall -y gTTS pydub

COPY config/uihelper.conf /etc/apache2/sites-available/uihelper.conf

RUN a2ensite uihelper.conf\
    && a2enmod ssl

COPY entrypoint.sh /var/
RUN chmod +x /var/entrypoint.sh

EXPOSE 80 443

# redirect apache logs to docker stdout/stderr
RUN ln -sf /proc/1/fd/1 /var/log/apache2/access.log
RUN ln -sf /proc/1/fd/2 /var/log/apache2/error.log

WORKDIR /var

ENTRYPOINT ["/bin/bash", "/var/entrypoint.sh"]